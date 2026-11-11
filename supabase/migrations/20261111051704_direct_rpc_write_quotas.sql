-- Direct Data API write backstop. Apply the whole migration transactionally.
-- RPC bodies/signatures/owners/grants remain unchanged; audit and mutation roll back together.
create schema app_private;
revoke all on schema app_private from public, anon, authenticated;

create table app_private.rpc_write_windows (
  actor_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('onboarding','administration','invitation','acceptance','invitation_delivery')),
  occurred_at timestamptz[] not null default '{}',
  primary key (actor_id, scope),
  check (cardinality(occurred_at) <= 60),
  check (array_position(occurred_at, null) is null)
);
alter table app_private.rpc_write_windows enable row level security;
revoke all on app_private.rpc_write_windows from public, anon, authenticated;
comment on table app_private.rpc_write_windows is
  'Private security metadata: at most five bounded timestamp arrays per actor, deleted with the auth user. Expired timestamps are pruned on the next write. Never financial records.';

create function app_private.rpc_write_policy(event_action text)
returns table(scope text, max_writes integer, window_seconds integer)
language sql immutable set search_path = '' as $$
  select p.scope, p.max_writes, p.window_seconds from (values
    ('onboarding',5,3600,array['tenant.created']),
    ('administration',60,600,array['member.role_changed','member.deactivated','member.revoked','tenant.settings.updated']),
    ('invitation',20,3600,array['member.invited']),
    ('acceptance',20,600,array['member.invitation_accepted']),
    ('invitation_delivery',40,3600,array['member.invitation_sent','member.invitation_delivery_failed'])
  ) as p(scope,max_writes,window_seconds,actions)
  where event_action = any(p.actions);
$$;
revoke all on function app_private.rpc_write_policy(text) from public, anon, authenticated;

-- SECURITY DEFINER is confined to a private, trigger-only security-metadata write.
-- It neither grants business access nor accepts a client-selected actor/quota.
create function app_private.enforce_rpc_write_quota()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  policy record;
  actor uuid := auth.uid();
  stamps timestamptz[];
  moment timestamptz;
begin
  select * into policy from app_private.rpc_write_policy(new.action);
  if not found then return new; end if;
  if actor is null or new.actor_user_id is distinct from actor then
    raise exception 'rpc_quota_identity_denied' using errcode = '42501';
  end if;

  insert into app_private.rpc_write_windows(actor_id,scope)
    values(actor,policy.scope) on conflict do nothing;
  select occurred_at into stamps from app_private.rpc_write_windows
    where actor_id=actor and scope=policy.scope for update;
  if not found then raise exception 'rpc_quota_unavailable'; end if;
  -- Take the time after the row lock. Backward clock movement cannot reset a window.
  select greatest(clock_timestamp(),max(s)) into moment from unnest(stamps) as s;
  select coalesce(array_agg(s order by s),'{}'::timestamptz[]) into stamps
    from unnest(stamps) as s
    where s > moment - make_interval(secs => policy.window_seconds);
  if cardinality(stamps) >= policy.max_writes then
    -- PostgREST maps PT429 to HTTP 429, without automatic serialization retries.
    raise sqlstate 'PT429' using message = 'rpc_rate_limited';
  end if;
  update app_private.rpc_write_windows set occurred_at=array_append(stamps,moment)
    where actor_id=actor and scope=policy.scope;
  return new;
end;
$$;
revoke all on function app_private.enforce_rpc_write_quota() from public, anon, authenticated;

-- CREATE TRIGGER takes a SHARE ROW EXCLUSIVE lock on audit_events, held to commit.
-- Install before seeding so concurrent audited mutations cannot escape the backfill.
create trigger a_enforce_rpc_write_quota before insert on public.audit_events
  for each row execute function app_private.enforce_rpc_write_quota();

-- Preserve recent usage on upgrades; keep only the newest quota-sized history.
-- No audit/business row is rewritten or deleted. No external provider call is made.
with recent as (
  select a.actor_user_id, p.scope, p.max_writes, a.created_at,
    row_number() over(partition by a.actor_user_id,p.scope order by a.created_at desc,a.id desc) as rank
  from public.audit_events a
  cross join lateral app_private.rpc_write_policy(a.action) p
  where a.actor_user_id is not null
    and a.created_at > statement_timestamp() - make_interval(secs => p.window_seconds)
)
insert into app_private.rpc_write_windows(actor_id,scope,occurred_at)
  select actor_user_id,scope,array_agg(created_at order by created_at)
  from recent where rank <= max_writes group by actor_user_id,scope;
