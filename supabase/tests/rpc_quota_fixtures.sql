-- Disposable CI only; enclosing transaction/fixture cleanup owns every row.
reset role;
do $$
declare actor uuid:=gen_random_uuid(); recipient uuid:=gen_random_uuid(); member_id uuid:=gen_random_uuid();
  t uuid; m uuid; i integer;
begin
  perform set_config('quota_test.actor',actor::text,true);
  perform set_config('quota_test.recipient',recipient::text,true);
  perform set_config('quota_test.member',member_id::text,true);
  insert into auth.users(id,email,email_confirmed_at) values
    (actor,actor||'@example.invalid',now()),(recipient,recipient||'@example.invalid',now()),(member_id,member_id||'@example.invalid',now());
  insert into public.profiles(id,email) select id,email from auth.users where id in (actor,recipient,member_id);
  for i in 1..2 loop
    t:=gen_random_uuid();
    perform set_config('quota_test.tenant_'||i,t::text,true);
    insert into public.tenants(id,name,slug) values(t,'RPC quota fixture','test-'||t);
    insert into public.tenant_settings(tenant_id,country,base_currency,timezone,default_locale) values(t,'TG','XOF','UTC','fr');
    insert into public.memberships(tenant_id,user_id) values(t,actor) returning id into m;
    insert into public.membership_roles(membership_id,role_id) select m,id from public.roles where key='tenant_admin';
    if i=1 then
      insert into public.memberships(tenant_id,user_id) values(t,member_id) returning id into m;
      perform set_config('quota_test.membership',m::text,true);
      insert into public.membership_roles(membership_id,role_id) select m,id from public.roles where key='cashier';
    end if;
  end loop;
end;
$$;
create function pg_temp.quota_actor(label text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub',current_setting('quota_test.'||label),true);
  perform set_config('request.jwt.claims',json_build_object('sub',current_setting('quota_test.'||label),'role','authenticated')::text,true);
end;
$$;
create function pg_temp.quota_reject(statement text, expected_code text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if sqlstate=expected_code and (expected_code<>'PT429' or sqlerrm='rpc_rate_limited') then return; end if;
    raise exception 'unexpected RPC quota rejection';
  end;
  raise exception 'RPC quota operation unexpectedly succeeded';
end;
$$;
