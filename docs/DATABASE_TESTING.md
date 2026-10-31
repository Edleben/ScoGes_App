# Supabase connection and tenant isolation

## Configuration

Keep credentials in ignored `.env.local`, or set environment variables directly:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: HTTPS checks.
- `DATABASE_URL`: PostgreSQL connection with permission to create transactional test
  fixtures, set the `authenticated`/`anon` roles, and apply temporary migrations.
- `DATABASE_SSL_ROOT_CERT`: optional CA file override. Defaults to the bundled public
  Supabase Root 2021 CA. This certificate is public, not a private key or credential.

The app continues to use the Supabase HTTPS client; `pg` is a development dependency
used only by the database verification script. This runner uses `DATABASE_URL`, not an Auth administrative API key. Browser fixture setup/cleanup uses the separate server-only `SUPABASE_SECRET_KEY`.

Hosted database tests force TLS with certificate and hostname verification. URL SSL overrides
are removed before connecting. Only disposable loopback databases may opt into plaintext
with `DATABASE_TEST_LOCAL=1`; hosted endpoints are rejected in that mode. The public
CA was downloaded from
`https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt`.
For a different CA, download the project's certificate from Database Settings and use
the override. See [Supabase SSL guidance](https://supabase.com/docs/guides/platform/ssl-enforcement).

## Commands

```sh
pnpm check:supabase
pnpm test:db
```

The HTTPS check only reports HTTP status and does not authenticate a user. A successful
schema check alone does not prove tenant isolation.

The database runner opens one transaction. On a fresh database it temporarily loads
the foundation migration, and loads the self-read policy fix if absent. It then inserts
random test users/tenants and executes `supabase/tests/tenant_isolation.sql` under actual
database roles. Both schema setup and fixtures are rolled back on success or failure.
Use a dedicated development/test database: the runner requires elevated fixture setup
permissions and briefly takes locks. It must not be used as a production health probe.

Checks cover cashier self-membership and assigned roles, own tenant access, denied
directory/profile enumeration, cross-tenant reads and updates, self-role escalation,
missing invitation permission, forged actors, inactive memberships, administrator
access, and anonymous access. The session unit tests separately verify query scoping,
stable membership selection, and safe handling of database errors.

To reproduce the original cashier failure against an unpatched/fresh database:

```sh
node scripts/test-database.mjs --baseline
```

`--baseline` skips applying the self-read fix; it does not remove already-deployed
policies. The original failure was reproduced before deployment on 2026-10-28.

## Deployment and verification recorded on 2026-10-28

The configured database had no public tables or migration history. Supabase CLI
`db push` installed the existing foundation migration and the append-only
`20261028013153_fix_membership_self_read.sql`, retaining migration history.

After deployment: Auth and membership schema checks returned HTTP 200; database
authorization assertions passed; every public table had RLS enabled; test fixtures
were rolled back. No business tenant or membership records were retained.

Hosted execution is opt-in and requires the configured development/test connection. Ordinary CI runs this script against disposable local Supabase without production secrets. Authentication and administration SQL suites share the rolled-back transaction, including audit-failure rollback and revoked access checks. Browser fixtures require `SUPABASE_SECRET_KEY`; manual runs may skip when it is missing, while CI fails instead of skipping. See [Authentication lifecycle](AUTHENTICATION.md).

## Isolated CI

GitHub CI applies all migrations to disposable local Supabase before testing.
`CI_ENFORCE_INTEGRATION=1` rejects missing schema instead of loading temporary
migrations, so tests cannot conceal a broken migration sequence. See [CI](CI.md).

## Concurrency fixtures and current evidence

After the transactional suite, explicit isolated CI runs `scripts/tests/administration-concurrency.mjs` with separate connections. It commits synthetic race fixtures only on an opted-in loopback database, verifies that concurrent demotion/deactivation retains an active administrator, checks audit counts, and cleans up by exact IDs. Never enable this mode against a hosted database.

The dated baseline is [SPRINT_0_VALIDATION.md](SPRINT_0_VALIDATION.md); the migration chain is in [DATA_MODEL.md](DATA_MODEL.md). Recheck environment identity privately as described in [AI_HANDOFF.md](AI_HANDOFF.md).

## Isolated email expiry fixtures

The email browser suite invokes `scripts/ci/email-fixtures.mjs` over stdin with non-secret fixture IDs/addresses. The CLI requires CI/local opt-in and loopback database, Auth, application, mailbox and SMTP endpoints. It verifies exact synthetic identity ownership before changing issuance timestamps or invitation expiry; optional one-time-token expiry columns are detected from the installed Auth schema. No DDL, global lifetime or clock changes occur. Tenant cleanup additionally checks synthetic creator identity and the unique `e2e-mail-` slug prefix. Auth accounts are discovered by exact generated address and deleted by exact verified ID.

Guard tests in `tests/ci/email-fixtures.test.mjs` reject hosted/deceptive endpoints and partial opt-in. These mutation helpers must never be adapted to reset or age real account records. Hosted negative verification used separate explicitly owned synthetic records; see [email evidence](SPRINT_0_EMAIL_VALIDATION.md).
