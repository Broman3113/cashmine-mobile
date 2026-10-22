# CashMine mobile

**Live:** _link_ (open on a phone) · Expo (React Native, TypeScript), delivered as a web app.

_One paragraph about what the app does (filled in for the task)._

## Run locally

```bash
npm ci
npm run web   # http://localhost:8081, then paste your API token in the app
```

| Command                  | What it does                                                            |
| ------------------------ | ----------------------------------------------------------------------- |
| `npm run web`            | dev server in the browser (`npx expo start` for a dev build on a phone) |
| `npm run check`          | lint + typecheck + tests (web, iOS and Android test projects)           |
| `npm run deploy`         | web export + EAS Hosting production deploy                              |
| `npm run deploy:preview` | same, to a separate preview URL                                         |

## How this repository was built

The first five commits are a **template prepared before the task**: project setup, theme, UI primitives,
API layer and a form example, each with tests. **Work on the task starts after them.**
AI conversations are in [`ai-logs/`](ai-logs/); the rules the AI followed are in [`CLAUDE.md`](CLAUDE.md).

## Architecture

- **Expo Router + TypeScript (strict)**, static web output (`web.output: "single"`).
- **Layers:** `app` (routes) → `features` → `ui` / `api` / `theme`. Lower layers never import higher ones, features
  never import each other; enforced by ESLint.
- **API:** one `request()` function; every response is validated with zod; typed `ApiError` (network / http / parse).
- **Server state:** TanStack Query. Queries retry only network, 5xx and 429 errors; mutations never retry.
- **Forms:** react-hook-form + zod, validation on touch, server errors next to the field.
- **UI:** small primitives on CashMine's design tokens, light and dark mode, keyboard handling via
  react-native-keyboard-controller, mobile-first layout capped at 560px on desktop.
- **Tests:** jest runs every test for web (React Testing Library, DOM) and iOS/Android (React Native Testing Library).

## What was built for the task

- _..._

## Decisions and trade-offs

See [`NOTES.md`](NOTES.md).

## Known issues / next steps

- _..._
