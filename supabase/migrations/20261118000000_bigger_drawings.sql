-- 2026-11-18: a detailed iPad drawing (11/17) passed 200 KB and could not be saved.
-- The app now allows a page up to 1 MB of JSON; jsonb stores numbers larger than JSON text,
-- so the column limit is 4 MB to leave room.
begin;

do $$
declare
  drawing_check text;
  matches integer;
begin
  -- Locate the original unnamed drawing size check by its definition, not its generated name.
  select count(*), min(conname::text)
    into matches, drawing_check
  from pg_constraint
  where conrelid = 'public.pages'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%pg_column_size(drawing)%200000%';

  if matches <> 1 then
    raise exception 'Expected exactly one original pages drawing size check, found %', matches;
  end if;
  execute format('alter table public.pages drop constraint %I', drawing_check);
end $$;

alter table public.pages add constraint pages_drawing_size_check
  check (pg_column_size(drawing) < 4000000);

commit;
