-- Invoked only after the local-only guard. No fixture or DDL is committed.
do $$
declare
  binding record;
begin
  if not exists (
    select 1 from pg_proc where oid = 'public.touch_updated_at()'::regprocedure
      and not prosecdef and proconfig @> array['search_path=pg_catalog']
  ) then raise exception 'timestamp helper is not pinned and security invoker'; end if;

  for binding in select * from (values
    ('tenants', 'touch_updated_at'), ('profiles', 'touch_updated_at'),
    ('memberships', 'advance_administration_revision'),
    ('tenant_settings', 'advance_administration_revision')
  ) as expected(table_name, function_name) loop
    if not exists (
      select 1 from pg_trigger t
      where t.tgrelid = format('public.%I', binding.table_name)::regclass
        and t.tgname = binding.table_name || '_touch_updated_at'
        and t.tgfoid = format('public.%I()', binding.function_name)::regprocedure
        and not t.tgisinternal and t.tgenabled = 'O' and t.tgtype = 19
    ) then raise exception 'timestamp trigger binding changed'; end if;
  end loop;
end;
$$;

-- A hostile caller search path must not redirect now() to an untrusted function.
-- CREATE (not REPLACE) deliberately fails if an unexpected same-name object exists.
create function public.now() returns timestamptz language plpgsql as $$
begin
  raise exception 'timestamp shadow function was executed';
end;
$$;
set local search_path = public, pg_catalog;

do $$
declare
  timestamp_value timestamptz;
  previous_revision timestamptz;
  revision timestamptz;
begin
  update public.tenants set name = 'Updated timestamp fixture'
    where id = current_setting('timestamp_test.tenant')::uuid
    returning updated_at into timestamp_value;
  if timestamp_value is distinct from pg_catalog.transaction_timestamp() then
    raise exception 'tenant timestamp semantics changed';
  end if;
  update public.profiles set full_name = 'Timestamp fixture'
    where id = current_setting('timestamp_test.user')::uuid
    returning updated_at into timestamp_value;
  if timestamp_value is distinct from pg_catalog.transaction_timestamp() then
    raise exception 'profile timestamp semantics changed';
  end if;

  select updated_at into previous_revision from public.memberships
    where id = current_setting('timestamp_test.membership')::uuid;
  for i in 1..2 loop
    update public.memberships set status = status
      where id = current_setting('timestamp_test.membership')::uuid
      returning updated_at into revision;
    if revision is null or revision <= previous_revision then
      raise exception 'membership revision did not advance';
    end if;
    previous_revision := revision;
  end loop;
  select updated_at into previous_revision from public.tenant_settings
    where tenant_id = current_setting('timestamp_test.tenant')::uuid;
  for i in 1..2 loop
    update public.tenant_settings set default_locale = default_locale
      where tenant_id = current_setting('timestamp_test.tenant')::uuid
      returning updated_at into revision;
    if revision is null or revision <= previous_revision then
      raise exception 'settings revision did not advance';
    end if;
    previous_revision := revision;
  end loop;
end;
$$;
