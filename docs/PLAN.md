# Plan

2-hour slice of the CashMine app: see payback balances and claim them. Web build of an Expo app, opened on a phone.
Deadline 2026-10-22 21:00 UTC. Correctness of money and the claim flow comes before polish.

## Scope

### Must (in this order)

1. **Token gate** (`/token`, root layout redirect)
   - Text field for the token, saved in `localStorage`, "Change token" from Home.
   - Base URL is one constant (`API_BASE_URL`); token sent only as `Authorization: Bearer`.
   - Token change or 401: root layout clears the query cache, then redirects to `/token`. Stored claim attempts are
     not deleted: they are keyed by a hash of the token, and only the current token's attempts are loaded.
2. **API client**
   - Parse the error envelope `{ error: { code, message, field?, retryAfterMs? } }` into `ApiError`.
   - Query retries: network/5xx/429 only, 429 waits `retryAfterMs` (fallback `Retry-After` header), never 401.
3. **Balances (Home, `/`)**
   - Per asset: available, pending, claiming, rounded down to `decimals`.
   - Main figure "Available to claim" in USD (available only); smaller "Total incl. pending & claiming".
   - "Updated N s ago" from `asOf`. Loading, error with retry, empty, refresh.
4. **Claim (`/claim?asset=...`, `/claims/[id]`)**
   - Asset, amount, Max; `claim-options` gives minAmount, fee, destinations (preselect when there is one).
   - Live fee and receive amount; confirm step; POST with `Idempotency-Key`; follow the claim until it settles.
   - Balance-after-claim behaviour: decided in its own AI conversation (at least two approaches) before claim code.
5. **Tests** for amount logic: normalize, parse, validate, fee/receive, USD totals, round-down display.
6. **Deliverables**: `NOTES.md`, minimal `README.md`, `ai-logs/`, deploy early and after each feature.

### Nice (if time allows)

- Activity (`/activity`): `useInfiniteQuery` with `cursor`/`nextCursor`, `FlatList`, signed amounts, statuses.
- "Still processing" hint when a claim is pending past ~30 s.
- Client request timeout (AbortController) for slow requests.

## Key rules for the claim flow

### Amount input
- Normalization rewrites the visible field value: `","` → `"."`, `".5"` → `"0.5"`, `"05"` → `"5"`.
  The user sees exactly the string that will be sent. Unit-tested. Recorded in `NOTES.md` as a decision.
- After normalization the value must match the API format (no leading zeros, no `"1."`, no `"1e-3"`) and have at most
  the asset's `decimals` places.
- `createClaimSchema({ decimals, minAmount, available, fee })`: minAmount ≤ amount ≤ available, amount − fee > 0.
  All comparisons with big.js.

### Max
- Max = snapshot `available` minus our in-flight claims for that asset (the snapshot can lag up to 15 s), never below 0,
  rounded down to `decimals`.
- The server checks `available` live. A 400 VALIDATION on field `amount` refetches balances and shows the server
  message next to the amount field.

### Idempotency and unknown outcomes
- One `Idempotency-Key` per user intent, created in the confirm handler, stored with the exact request body
  in `localStorage` (survives a reload), under a key derived from a SHA-256 hash of the token
  (`crypto.subtle.digest`), never the token itself.
- Outcome by response:

  | Response | Meaning | App does |
  |---|---|---|
  | 201 / 200 replayed | claim exists | show it, poll until completed/failed |
  | 400 VALIDATION | not created | show message (field or root), allow edit; key discarded |
  | 409 IDEMPOTENCY_MISMATCH | body changed under the same key: our bug | show an error, no retry |
  | 429 RATE_LIMITED | not processed | wait `retryAfterMs`, resend same key + body |
  | network error, timeout, 500, 503, 504 | unknown | resend same key + body (3 tries with backoff), then "Check again" |
  | 401 | token invalid/expired | token flow; the attempt stays stored under that token's hash |

- While an attempt is unresolved, only that asset is locked for new claims.
- Only the current token's attempts are loaded. Entering the same token again (e.g. after a 401 or switching back)
  brings its unresolved attempts back, so they can still be resolved by resending. Other tokens never see them.
- An attempt is removed once it is resolved (claim returned, or 400/409 shown to the user).
- `crypto.randomUUID()` works on web (secure context). Native would need `expo-crypto`: listed under "Not done".

## Risks

| Risk | Mitigation |
|---|---|
| Double claim after a timeout | Same key + body on every resend; asset locked until resolved |
| Stale snapshot after a claim (up to 15 s) | Max subtracts in-flight claims; balance-after-claim decision; freshness from `asOf` |
| Rate limit shared by all requests of a token | Honor `retryAfterMs`; no polling faster than needed (balances ≥ 15 s, claim ~2 s) |
| Data of one token shown for another | Cache cleared on token change; stored attempts keyed by token hash |
| Float errors / "1e-8" | big.js only, `toFixed()` for strings, no `Number()` on money |
| Token leaks into repo or build | Runtime entry only; never in env, URL, logs or query keys |
| Hosting problems late | Deploy the skeleton first, then after each feature |
| Time | Cut-list below |

## Cut-list (drop from the bottom first)

1. Activity screen
2. Client request timeout
3. "Still processing" hint
4. Native-specific polish (pull-to-refresh is free via `Screen`; nothing else)
5. Component tests for screens (keep the unit tests for amount logic, they are required)

Never cut: token handling, correct amount validation, idempotent claim with the unknown-outcome flow, the notes.

## Not done (known up front)

- Native: `crypto.randomUUID` needs `expo-crypto`; token store is in-memory on native.
- Token in `localStorage` is readable by any script on the page (XSS). Acceptable for a test token; a real app would
  use secure storage on native and a server session on web.
- Stored attempts of tokens that are never entered again stay in `localStorage` (small, no cleanup for now).

## Order of work and commits

1. `docs:` CLAUDE.md rules (done), this plan
2. `chore:` remove the withdraw demo and the preview screen
3. `feat(api):` base URL constant, Bearer token, error envelope, 429 delay, token store
4. `feat(token):` token screen + gate in the root layout → **first deploy**
5. `feat(lib):` money helpers + tests (big.js)
6. `feat(balances):` Home → deploy
7. AI conversation: balance after claim (log in `ai-logs/`), decision into `NOTES.md`
8. `feat(claim):` form, confirm, POST, status, unknown outcome → deploy
9. `feat(activity):` if time allows → deploy
10. `docs:` NOTES.md, README.md final pass, before 21:00 UTC
