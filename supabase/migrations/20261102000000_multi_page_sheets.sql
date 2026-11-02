begin;

do $$
declare
  id_check text;
  matches integer;
begin
  -- Locate the original unnamed ID check by its definition, not its generated name.
  select count(*), min(conname::text)
    into matches, id_check
  from pg_constraint
  where conrelid = 'public.pages'::regclass
    and contype = 'c'
    and regexp_replace(pg_get_constraintdef(oid), '[[:space:]()]', '', 'g') =
      'CHECKid=date::text||''__''::text||child_id||''__''::text||author_id';

  if matches <> 1 then
    raise exception 'Expected exactly one original pages ID check, found %', matches;
  end if;
  execute format('alter table public.pages drop constraint %I', id_check);
end $$;

alter table public.pages add constraint pages_sheet_id_check check (
  id = date::text || '__' || child_id || '__' || author_id
  or (
    length(id) = length(date::text || '__' || child_id || '__' || author_id) + 10
    and left(id, length(date::text || '__' || child_id || '__' || author_id) + 2) =
      date::text || '__' || child_id || '__' || author_id || '__'
    and substring(id from length(date::text || '__' || child_id || '__' || author_id) + 3)
      ~ '^[a-z0-9]{8}$'
  )
);

commit;
