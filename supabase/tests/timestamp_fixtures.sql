-- Disposable CI only. The enclosing test transaction rolls back every fixture.
select set_config('timestamp_test.tenant', gen_random_uuid()::text, true);
select set_config('timestamp_test.user', gen_random_uuid()::text, true);
select set_config('timestamp_test.membership', gen_random_uuid()::text, true);

insert into public.tenants(id, name, slug, updated_at)
values (current_setting('timestamp_test.tenant')::uuid, 'Timestamp fixture',
  'test-timestamp-' || current_setting('timestamp_test.tenant'), '2000-01-01 00:00:00+00');
insert into auth.users(id, email)
values (current_setting('timestamp_test.user')::uuid,
  current_setting('timestamp_test.user') || '@example.invalid');
insert into public.profiles(id, email, updated_at)
values (current_setting('timestamp_test.user')::uuid,
  current_setting('timestamp_test.user') || '@example.invalid', '2000-01-01 00:00:00+00');
insert into public.tenant_settings(tenant_id, country, base_currency, timezone, updated_at)
values (current_setting('timestamp_test.tenant')::uuid, 'TG', 'XOF', 'UTC', '2100-01-01 00:00:00+00');
insert into public.memberships(id, tenant_id, user_id, updated_at)
values (current_setting('timestamp_test.membership')::uuid,
  current_setting('timestamp_test.tenant')::uuid,
  current_setting('timestamp_test.user')::uuid, '2100-01-01 00:00:00+00');
