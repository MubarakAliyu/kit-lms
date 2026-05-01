# Kids In Tech LMS

Learning portal for Kids In Tech (Starnova Labs) — companion app to the marketing site at [kidsintech.school](https://kidsintech.school). Deployed to Vercel at `lms.kidsintech.school`.

## Stack

- Next.js 16 (App Router, JS only — no TypeScript)
- React 19, Tailwind CSS v4
- Auth: NextAuth.js (Google OAuth + credentials)
- State: Zustand stores in `src/_store`
- HTTP: Axios services in `src/_lib/api`
- Realtime: socket.io-client (chat, notifications)
- Forms: react-hook-form + zod
- Animation: motion/react
- Charts: recharts
- Toasts: sonner
- Mock API (dev only): msw

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in values
npm run dev                         # starts on http://localhost:3001
```

The dev server runs on **port 3001** so the marketing site (port 3000) and the LMS can run side-by-side locally.

## Scripts

| Command         | Purpose                                    |
|-----------------|--------------------------------------------|
| `npm run dev`   | Start dev server on port 3001 (Turbopack)  |
| `npm run build` | Production build                           |
| `npm run start` | Serve the production build                 |
| `npm run lint`  | ESLint                                     |

## Project layout

```
src/
  app/
    (auth)/           Login, forgot/reset password — split-screen layout
    (dashboard)/      Role dashboards (student, parent, instructor, admin)
    layout.js         Root layout: fonts, Sonner toaster, metadata
    page.js           Redirects / → /login
    globals.css       Tailwind + LMS design tokens
  _components/        Shared UI (sidebar, topbar, cards, etc.)
  _lib/api/           Axios service modules — one per domain
  _hooks/             useAuth, useNotifications, useLanguage
  _store/             Zustand stores
  _locales/           en.json, ha.json (English / Hausa)
  _types/schema.js    JSDoc @typedefs for all backend entities
```

The leading `_` makes a folder private to App Router (it won't generate routes). Route groups in parentheses (`(auth)`, `(dashboard)`) group routes without adding URL segments — e.g. `(auth)/login/page.jsx` resolves to `/login`.

## Environment variables

Documented in `.env.local.example`. Highlights:

| Variable                | Purpose                                                |
|-------------------------|--------------------------------------------------------|
| `NEXT_PUBLIC_LMS_URL`   | Public base URL (`http://localhost:3001` in dev)       |
| `NEXTAUTH_URL`          | Must match `NEXT_PUBLIC_LMS_URL`                       |
| `NEXTAUTH_SECRET`       | NextAuth session secret (`openssl rand -base64 32`)    |
| `GOOGLE_CLIENT_ID`      | Google OAuth client ID                                 |
| `GOOGLE_CLIENT_SECRET`  | Google OAuth client secret                             |
| `NEXT_PUBLIC_API_URL`   | Backend REST API base URL (axios services read this)   |

## Design tokens

Defined in `src/app/globals.css` and exposed to Tailwind v4 via `@theme inline`:

| Token                  | Value     | Use                          |
|------------------------|-----------|------------------------------|
| `--color-primary`      | `#10B981` | Accent (CTAs, active states) |
| `--color-primary-dark` | `#059669` | Hover / pressed              |
| `--color-navy`         | `#0B1220` | Dark panels, sidebar         |
| `--color-surface`      | `#FFFFFF` | Light backgrounds            |
| `--color-text`         | `#E5E7EB` | Text on dark panels          |

Use as Tailwind utilities: `bg-primary`, `text-navy`, `bg-surface`, etc.

## Schema

`src/_types/schema.js` holds JSDoc `@typedef` for every backend entity. Entries marked `[Backend-confirmed]` match the spec verbatim — never rename their fields. Entries marked `[Pending verification]` need to be reconciled with the backend before live integration.
