# Supabase connection and tenant isolation

## Configuration

Keep credentials in ignored `.env.local`, or set environment variables directly:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: HTTPS checks.
- `DATABASE_URL`: PostgreSQL connection with permission to create transactional test
  fixtures, set the `authenticated`/`anon` roles, and apply temporary migrations.
- `DATABASE_SSL_ROOT_CERT`: optional CA file override. Defaults to the bundled public
  Supabase Root 2021 CA. This certificate is public, not a private key or credential.

The app continues to use the Supabase HTTPS client; `pg` is a development dependency
used only by the database verification script. The service-role API key is not used.

Database tests force TLS with certificate and hostname verification. URL SSL overrides
are removed before connecting; certificate verification is never disabled. The public
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

The database script is opt-in and is not part of ordinary credential-free CI.
It now also tests the authentication-lifecycle migration and invitation acceptance
in the same rolled-back transaction. See [Authentication lifecycle](AUTHENTICATION.md)
for the browser tests and external configuration requirements. Live browser tests
are explicitly skipped while the required test-account service-role key is missing.
