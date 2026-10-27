-- Fresh project only. No users, invite secrets, or family data are seeded here.
create extension if not exists pgcrypto with schema extensions;

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create table public.family_members (
  user_id uuid primary key references auth.users on delete cascade,
  family_id uuid not null references public.families on delete cascade,
  member_id text not null check (member_id in ('dad', 'mom', 'reader')),
  role text not null check (role in ('owner', 'writer', 'reader')),
  joined_at timestamptz not null default now(),
  check ((member_id = 'reader') = (role = 'reader'))
);
create index on public.family_members (family_id);
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families on delete cascade,
  member_id text not null check (member_id in ('dad', 'mom', 'reader')),
  role text not null check (role in ('owner', 'writer', 'reader')),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  check ((member_id = 'reader') = (role = 'reader'))
);
create index on public.invites (family_id, member_id);
create table public.join_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  attempted_at timestamptz not null default now()
);
create index on public.join_attempts (user_id, attempted_at);

-- These helpers prevent recursive RLS and never trust JWT metadata for membership.
create function public.family_access(p_family_id uuid, p_write boolean default false)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.family_members
    where user_id = auth.uid() and family_id = p_family_id
      and (not p_write or role in ('owner', 'writer')));
$$;

create table public.children (
  family_id uuid not null references public.families on delete cascade,
  id text not null,
  name text not null,
  nickname text,
  birth_date date,
  due_date date,
  status text not null default 'expecting' check (status in ('born', 'expecting')),
  color text not null check (color in ('kid1', 'kid2')),
  page_color text not null,
  sort_order integer not null default 0,
  photo jsonb,
  photo_history jsonb not null default '[]',
  primary key (family_id, id)
);
create table public.tags (
  family_id uuid not null references public.families on delete cascade,
  id text not null,
  label text not null,
  emoji text not null,
  tone text not null,
  sort_order integer not null default 0,
  preset boolean not null default false,
  hidden boolean not null default false,
  primary key (family_id, id)
);
create table public.members (
  family_id uuid not null references public.families on delete cascade,
  member_id text not null check (member_id in ('dad', 'mom')),
  display_name text not null,
  color text not null check (color in ('dad', 'mom')),
  font_asset_path text,
  primary key (family_id, member_id)
);
create table public.pages (
  id text primary key,
  family_id uuid not null references public.families on delete cascade,
  child_id text not null,
  date date not null,
  author_id text not null check (author_id in ('dad', 'mom')),
  color text,
  drawing jsonb not null default '[]' check (pg_column_size(drawing) < 200000),
  photos jsonb not null default '[]',
  text text not null default '',
  tag_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (id = date::text || '__' || child_id || '__' || author_id),
  foreign key (family_id, child_id) references public.children (family_id, id),
  foreign key (family_id, author_id) references public.members (family_id, member_id),
  unique (family_id, id)
);
create index on public.pages (family_id, date);
create table public.comments (
  family_id uuid not null references public.families on delete cascade,
  id text not null,
  page_id text not null,
  content text not null,
  author_id text not null check (author_id in ('dad', 'mom')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (family_id, id),
  foreign key (family_id, page_id) references public.pages (family_id, id) on delete cascade,
  foreign key (family_id, author_id) references public.members (family_id, member_id)
);
create table public.reactions (
  family_id uuid not null references public.families on delete cascade,
  page_id text not null,
  member_id text not null check (member_id in ('dad', 'mom')),
  emoji text not null default '❤️' check (emoji = '❤️'),
  primary key (family_id, page_id, member_id),
  foreign key (family_id, page_id) references public.pages (family_id, id) on delete cascade,
  foreign key (family_id, member_id) references public.members (family_id, member_id)
);

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.invites enable row level security;
alter table public.join_attempts enable row level security;
create policy family_read on public.families for select to authenticated
  using (public.family_access(id));
create policy membership_read on public.family_members for select to authenticated
  using (user_id = auth.uid());
-- No client may directly change enrollment, invites, attempts, or families.
revoke all on public.families, public.family_members, public.invites, public.join_attempts from anon, authenticated;
grant select on public.families, public.family_members to authenticated;
do $$
declare t text;
begin
  foreach t in array array['children','tags','members','pages','comments','reactions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy family_read on public.%I for select to authenticated using (public.family_access(family_id))', t);
    execute format('create policy family_insert on public.%I for insert to authenticated with check (public.family_access(family_id, true))', t);
    execute format('create policy family_update on public.%I for update to authenticated using (public.family_access(family_id, true)) with check (public.family_access(family_id, true))', t);
    execute format('create policy family_delete on public.%I for delete to authenticated using (public.family_access(family_id, true))', t);
    execute format('alter table public.%I replica identity full', t);
    execute format('alter publication supabase_realtime add table public.%I', t);
  end loop;
end $$;

-- NULL means invalid/rate-limited. Raising would roll back the failed-attempt log.
create function public.join_family(p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare invitation public.invites; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_granted'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text, 0));
  delete from public.join_attempts where attempted_at < now() - interval '1 hour';
  if (select count(*) from public.join_attempts where user_id = uid) >= 20 then
    return null;
  end if;
  select * into invitation from public.invites
    where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
      and revoked_at is null for update;
  if invitation.id is null or p_token !~ '^[A-Za-z0-9_-]{43}$' then
    insert into public.join_attempts (user_id) values (uid);
    return null;
  end if;
  -- An enrolled device cannot use a weaker invite to overwrite its owner role.
  if exists (select 1 from public.family_members where user_id = uid
      and family_id = invitation.family_id and role = 'owner') then
    return invitation.family_id;
  end if;
  insert into public.family_members (user_id, family_id, member_id, role)
    values (uid, invitation.family_id, invitation.member_id, invitation.role)
    on conflict (user_id) do update set family_id = excluded.family_id,
      member_id = excluded.member_id, role = excluded.role, joined_at = now();
  return invitation.family_id;
end $$;

create function public.create_invite(p_member_id text, p_token_hash text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me public.family_members; result uuid;
begin
  select * into me from public.family_members where user_id = auth.uid();
  if me.role is distinct from 'owner' then raise exception 'not_granted'; end if;
  if p_member_id not in ('dad', 'mom', 'reader') then raise exception 'invalid member'; end if;
  insert into public.invites (family_id, member_id, role, token_hash, created_by)
    values (me.family_id, p_member_id,
      case when p_member_id = 'reader' then 'reader' else 'writer' end,
      p_token_hash, auth.uid()) returning id into result;
  return result;
end $$;

create function public.revoke_invites(p_member_id text) returns void
language plpgsql security definer set search_path = '' as $$
declare me public.family_members;
begin
  select * into me from public.family_members where user_id = auth.uid();
  if me.role is distinct from 'owner' then raise exception 'not_granted'; end if;
  update public.invites set revoked_at = now()
    where family_id = me.family_id and member_id = p_member_id and revoked_at is null;
  delete from public.family_members where family_id = me.family_id
    and member_id = p_member_id and user_id <> auth.uid();
end $$;

create function public.storage_usage() returns bigint
language sql stable security definer set search_path = '' as $$
  select coalesce(sum((o.metadata->>'size')::bigint), 0)::bigint
  from storage.objects o join public.family_members m
    on m.user_id = auth.uid() and split_part(o.name, '/', 1) = m.family_id::text
  where o.bucket_id = 'photos';
$$;

-- Called by each backup. Remove old reader devices AND their anonymous Auth users.
create function public.prune_reader_members() returns integer
language plpgsql security definer set search_path = '' as $$
declare fid uuid; removed integer;
begin
  select family_id into fid from public.family_members where user_id = auth.uid();
  if fid is null then raise exception 'not_granted'; end if;
  with old_readers as (
    delete from public.family_members where family_id = fid and role = 'reader'
      and joined_at < now() - interval '2 days' and user_id <> auth.uid()
    returning user_id
  ) delete from auth.users where id in (select user_id from old_readers) and is_anonymous;
  get diagnostics removed = row_count;
  return removed;
end $$;

revoke all on function public.family_access(uuid, boolean),
  public.join_family(text), public.create_invite(text, text), public.revoke_invites(text),
  public.storage_usage(), public.prune_reader_members() from public, anon;
grant execute on function public.family_access(uuid, boolean),
  public.join_family(text), public.create_invite(text, text), public.revoke_invites(text),
  public.storage_usage(), public.prune_reader_members() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880,
  array['image/jpeg','image/png','image/webp','font/woff2','font/ttf']);
create policy family_photo_read on storage.objects for select to authenticated
  using (bucket_id = 'photos' and exists (select 1 from public.family_members
    where user_id = auth.uid() and family_id::text = split_part(name, '/', 1)));
create policy family_photo_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and exists (select 1 from public.family_members
    where user_id = auth.uid() and role in ('owner','writer')
      and family_id::text = split_part(name, '/', 1)));
create policy family_photo_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and exists (select 1 from public.family_members
    where user_id = auth.uid() and role in ('owner','writer')
      and family_id::text = split_part(name, '/', 1)));
