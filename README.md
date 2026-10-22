# CashMine mobile

**Live:** _[live link]_ (open on a phone)

A slice of the CashMine app built with Expo (React Native, TypeScript) and shipped as a web build: see payback
balances and claim them. Decisions, AI notes and known issues are in [`NOTES.md`](NOTES.md).

## Run locally

```bash
npm ci
npm run web   # http://localhost:8081, then paste your API token in the app
```

| Command         | What it does                                                  |
| --------------- | ------------------------------------------------------------- |
| `npm run web`   | dev server in the browser                                     |
| `npm run check` | lint + typecheck + tests (web, iOS and Android test projects) |

## What works

- **Token:** asked for on first open, kept in the browser, "Change token" on Home; a rejected or expired token
  sends you back to the token screen.
- **Balances (Home):** each asset's available, pending and claiming; "Available to claim" in USD and the total
  incl. pending & claiming; "Updated Xs ago" from the snapshot; refreshes every 15 s; loading, error with retry,
  empty and refresh button.
- **Claim:** pick an asset, enter an amount or tap Max, see the fee and what you receive, review and confirm.
  Validation follows the API rules. The claim status is polled until it completes or fails. Your claim shows on
  Home right away. If the result is unknown, the same request is resent safely and you can check again.
- **Tests:** amount logic (parsing, normalizing, validation, fee, receive, max, USD totals, display rounding),
  the in-flight claim overlay, idempotent resends, the API client and token handling.

Not built: the Activity screen. See [`NOTES.md`](NOTES.md) for everything that is missing.
