# R3 — Distributed limits and browser security

Status (2026-11-10): implementation prepared; final validation/review and deployment verification pending. No merge, deployment, paid plan upgrade, Sprint 0 acceptance or Sprint 1 activation is authorized. Owner approved managed Upstash Redis and Vercel ingress. The database was provisioned by the owner; credentials are local and server-only.

## Acceptance and architecture

Use the small server-only adapter in `src/lib/security/rate-limit.ts` and request context helper. SDKs are pinned with the lockfile. Redis never stores financial facts, permissions, membership or audit records. Supabase Auth, live membership/permission checks, RLS and invitation SQL throttles remain authoritative and unchanged.

## Endpoint policy

Sliding-window policies count attempts before side effects. Authenticated IDs are resolved by existing verified-session/membership helpers; tenant/form IDs never select a counter identity.

| Scope                          | Identity                     | Limit                                        |
| ------------------------------ | ---------------------------- | -------------------------------------------- |
| Login                          | Trusted ingress IP           | 60 / 10 minutes                              |
| Signup                         | Trusted ingress IP           | 10 / hour                                    |
| Password recovery              | Trusted ingress IP           | 20 / 15 minutes                              |
| PKCE code exchange             | Trusted ingress IP           | 60 / 10 minutes                              |
| Invitation token capture       | Trusted ingress IP           | 60 / 10 minutes                              |
| Password update                | Verified user                | 10 / 15 minutes                              |
| Invitation issuance            | Verified user across tenants | 20 / hour, plus existing SQL limits/cooldown |
| Invitation acceptance          | Verified user                | 20 / 10 minutes                              |
| Tenant onboarding              | Verified user                | 5 / hour                                     |
| Role/status/settings mutations | Verified user across tenants | 60 / 10 minutes                              |

Sign-out and ordinary reads remain available during provider failure. Invalid input and unauthorized requests retain existing validation/denial. The adapter returns allowed, limited or unavailable; action replies use existing French/English messages. Administrative limits return the generic temporary-unavailable response. PKCE failures redirect to a safe localized retry notice without exchanging the code.

## Configuration and trusted ingress

Required server-only settings: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. Never prefix them with NEXT_PUBLIC or print their values. Use separate databases/credentials for development, preview and production. Only HTTPS Redis is accepted on Vercel; HTTP is limited to loopback outside Vercel for disposable tests.

Vercel deployment must set `RATE_LIMIT_INGRESS=vercel` and supply its platform-owned `VERCEL=1`. Only then is the single valid `x-vercel-forwarded-for` IP used. Other forwarding headers, client Vercel-ID claims, missing/malformed lists and unconfigured production ingress cannot select an IP. IPv6 spellings and IPv4-mapped IPv6 normalize consistently. This assumes direct Vercel ingress; adding an upstream proxy requires a new trust review. Actual deployed header provenance must be verified before exposure.

For local HTTP-loopback `NEXT_PUBLIC_APP_URL`, all callers share one local bucket; arbitrary forwarding headers are ignored. This retains a real shared Redis limit, while deliberately providing no per-client distinction locally. Do not expose that configuration publicly.

## Privacy and retention

Keys use domain-separated HMAC-SHA256 with the server-only Redis token as keying material. Stored identifiers are opaque digests; no raw IP, email, user ID, session, invitation token or financial data is written. Analytics and ephemeral counter caching are disabled. The SDK's sliding-window keys expire after twice the window plus one second (up to approximately two hours for current policies). SDK script caching is separate and contains no personal identifiers. Credential rotation/restart changes identity digests and resets effective counters; coordinate rotation as a security operation.

## Failure behavior and observability

SDK timeout is 2 seconds; HTTP requests are aborted after 2.5 seconds, with automatic retries disabled. An SDK timeout result is rejected even when its success flag is true. Missing configuration, invalid ingress, Redis errors/quotas and transport failures block the protected operation. No process-local or fail-open fallback exists. Timed-out requests can still increment a counter before transport cancellation; this conservative consumption is intentional.

Provider failures log only a stable event and allowlisted scope, without provider payloads or identifiers. Missing configuration/unverified ingress returns unavailable without provider calls. Operational monitoring must alert on authentication/write unavailability, Redis quota/usage and latency; configure and exercise alerts before pilot. Free-tier quota exhaustion can therefore prevent login and sensitive writes until service resumes; it cannot bypass controls. Keep an operator recovery path and monitor usage before the owner-approved paid upgrade.

## Browser policy

Proxy-generated 144-bit random nonces are forwarded to Next.js and returned in CSP. Incoming policy/nonce headers are overwritten. Production scripts/styles require nonces; script/style attributes, objects, frames, embedding and base-tag changes are denied. Connections allow self and the exact configured Supabase origin. The tracker uses semantic native progress elements instead of inline width styles. Responses disable shared caching and use no-referrer. Static configuration adds nosniff, DENY framing, restricted device permissions and same-origin opener/resource policies. HTTPS production configuration adds HSTS without includeSubDomains/preload. HTTPS production requests also upgrade insecure resources.

Development-only debugging allows script eval, inline style elements and WebSockets as required by installed Next.js documentation; production has none of those exceptions. No hydration suppression is introduced. Third-party browser extensions can still mutate the document locally. Future telemetry/asset providers need deliberate policy review.

## Verification

Executed local/hosted checks on 2026-11-10: lint, types and production build passed; full unit/contract suite 126 passed, followed by 16 focused security tests including the additional scoped-IPv6 rejection case (current full suite expected 127; final CI verifies it). All 8 CI safety tests, workflow validation, changed-file formatting, 183 relative documentation links and a private client-asset secret scan passed. Hosted Supabase Auth/schema returned HTTP 200; database/RLS/invitation/administration/audit assertions passed and rolled back all fixtures. Hosted Redis concurrency/expiry, transport failure and actual SDK timeout: 3 passed. Production Chromium: 20 passed, zero failures/skips/flaky cases, covering both languages. An earlier browser run interrupted by dependency reconstruction is not accepted evidence; the clean frozen-install rerun passed. Dependency audit: one existing moderate minimatch finding, zero high/critical; R1 remains separate. Run ordinary checks and build, then `pnpm test:e2e` in production mode. `pnpm test:redis` requires either isolated CI settings or explicit `RATE_LIMIT_TEST_HOSTED=1`, which privately reads local credentials. Hosted integration uses only uniquely prefixed synthetic expiring keys, cleans only those keys, and withholds raw provider errors. It does not flush/reset the database or mutate customer records.

## Residual risk / release disposition

R3 is reduced in code but remains open pending final PR validation and deployed verification. Required before public preview/pilot: configure separate Vercel environment secrets and ingress selection, verify header provenance and FR/EN flows over HTTPS, exercise outage/quota alerting and agree usage thresholds. No hosted Vercel deployment has been performed here.

IP limits can affect schools behind shared NAT, while distributed sources/IPv6 address rotation can evade a single-IP policy. These controls complement Supabase Auth's direct-API throttling and SQL invitation controls; they do not replace provider CAPTCHA/WAF/DDoS protection. Tune thresholds from controlled pilot evidence without disabling fail-closed handling. Provider outage/free-tier quota exhaustion creates an explicit availability risk. Owner acceptance, R1/R2/R4–R7 dispositions and Sprint 0 closure remain independent.

Sources: [Upstash timeout/caching behavior](https://upstash.com/docs/redis/sdks/ratelimit-ts/features), [Vercel request headers](https://vercel.com/docs/headers/request-headers), installed Next.js 16 CSP/proxy/header guides under node_modules/next/dist/docs.
