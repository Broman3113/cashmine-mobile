# Notes

The first six commits (`f20f053` to `8f8bd8e`) are a template I prepared before the task: Expo setup, theme,
UI primitives, API client and a form example. Work on the task starts at `519f0f5`.

## Decisions

**Amounts.** The API sends amounts as decimal strings, and they stay strings. All math and comparisons go
through big.js in `src/lib/money.ts`, never `Number()`: floats get `0.1 + 0.2` wrong and lose digits on large
amounts, and the app moves money. Output always uses `toFixed()`, so it is plain notation (`0.00000001`, never
`1e-8`). Input is normalized as the user types (`,` → `.`, `.5` → `0.5`, `05` → `5`, spaces trimmed) and the
field shows the cleaned value; a trailing dot (`1.`) is dropped when the field loses focus. Validation follows
the API rules (format, asset decimals, min ≤ amount ≤ available) plus "you must receive more than 0". A valid
amount is sent in canonical form (`0.50` → `0.5`), so a resend is always the same body. Display rounds down
(toward zero), never showing more than there is. Formatting is fixed to en-US grouping (`1,234.5`) so it is
predictable and testable, not localized.

**Two USD numbers on Home.** The main figure is "Available to claim" (available only). Below it, smaller,
"Total incl. pending & claiming". Pending is not counted as claimable because the exchange can still reverse it.

**Balance right after a claim.** The snapshot is recomputed every 15 s and may not include a new claim yet;
a failed claim returns its amount to available. Options I compared:

- A. Show the snapshot as is, plus a "submitted" banner. Nothing is made up, but it causes both complaints:
  the balance does not move (so people claim again) and later jumps back.
- B. Optimistic overlay. Our claim moves from available to claiming at once and stays adjusted until a snapshot
  with `asOf ≥ claim.createdAt` arrives; from then on the server's numbers are used, so it is never counted twice.
  A failed claim drops its adjustment at once and says "Claim failed: reason. X is back in your available balance."
- C. Lock the asset until the claim settles. No double claims, but "available" is wrong for ~20 s and a
  legitimate second claim is blocked.

I asked the AI for options before choosing (ai-logs/claude-code-session.md, line 1005). I chose **B**: the balance reacts immediately (fixes "didn't change, so I claimed again"), Max uses the adjusted
balance, the total does not drop until money actually leaves, and a jump back on failure is explained instead of
silent.

**Unknown claim result.** On Confirm the app creates one `Idempotency-Key` and keeps it with the exact body.
Network errors, 500/503/504 and 429 mean the claim may or may not exist (429: not processed). The app resends the
same key and body up to 3 times (1 s, 2 s, 4 s, or `retryAfterMs` on 429). The API replays the original claim for
the same key and never creates a second one. If it is still unknown, the user sees "We could not confirm your
claim. It may have gone through." and **Check again**, which sends the same key and body again. A 400 means not
created: the message goes on the amount field and balances are refetched. A 409 means the body changed under the
same key (a bug on our side): an error is shown and nothing is resent.

**Token.** Entered at runtime, kept in `localStorage`, never in the code, the build or a URL; sent only as a
Bearer header. The base URL is one constant. A 401 removes only the token that request was sent with, so a
token entered meanwhile survives. Every token change clears the query cache and the in-flight claims, since data
is private to each token. Known trade-off: `localStorage` is readable by any script on the page.

**Where I skipped my own rules.** The amount form uses plain `useState` + the `money.ts` validator instead of
react-hook-form: it has one field and time was short. `claim-status.tsx` disables `react-hooks/exhaustive-deps`
for one effect so `onSettled` fires once, when the status changes from pending, not on every 2 s poll.

## Working with AI

All conversations are in [`ai-logs/`](ai-logs/).

1. **A prompt that did not work.** My first prompts were long and heavily structured; the answers grew just as
   long and I spent time reading instead of deciding. I switched to short, plain prompts with one task each.
   (ai-logs/claude-code-session.md, line 8)
2. **Risky AI output.** My personal `.claude/settings.local.json` was staged when the session started, and the
   AI went to commit without checking what was staged. I caught it in `git status`, had it unstage the file, and
   made "add files explicitly, never `git add .`" a rule. (ai-logs/claude-code-session.md, line 423)
3. **Where I disagreed.** The AI planned to delete stored claim attempts on every token change. That would lose
   an unknown claim if the user re-enters the same token after a 401. We keep them under a SHA-256 hash of the
   token instead, and load only the current token's attempts. (ai-logs/claude-code-session.md, line 496)

Also: I asked for the money tests before the implementation, reviewed the edge cases, and added two the AI had
not covered (pasted values with spaces, dropping a trailing dot on blur) (ai-logs/claude-code-session.md, line 759).

## Not done / known issues

- Activity screen (paginated history) is not built.
- In-flight claims and unresolved claim attempts live in memory: a reload or leaving the claim screen while the
  result is unknown loses them. The per-token-hash storage is designed (see above) but not implemented.
- No per-asset lock while a claim's result is unknown; the review screen only hides Edit and offers Check again.
- Only the first destination from `claim-options` is used; there is no picker.
- No client-side request timeout: a hanging request relies on the browser's own timeout.
- If a 201 response does not match the schema, the claim exists but the app shows an error.
- Native: `crypto.randomUUID` would need `expo-crypto`; the token is kept in memory only on iOS/Android.
- "Change token" drops the current token immediately; there is no cancel.
- The Max button is aligned to the input by offsetting it by the Field's label height; if Field's label layout
  changes, this needs updating (a Field option for a trailing button would be cleaner).
