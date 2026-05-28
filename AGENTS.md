<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Bhojan — Agent Guide

## Tech stack
- **Next.js 16 + React 19 + TypeScript strict**. Check `next/dist/docs/` before coding.
- **Tailwind v4** — CSS-based config via `@theme` in `globals.css`. The legacy `tailwind.config.ts` is still present but v4 CSS directives (`@import "tailwindcss"`) take precedence.
- **shadcn/ui** in `radix-nova` style (not default). UI components in `src/components/ui/` — do not edit.
- **Supabase** gracefully falls back to local demo mode when env vars missing (`src/lib/supabase/config.ts`). Auth proxy in `src/proxy.ts` (not `middleware.ts` — there is none).
- **State**: React useState/Context only. No external library.
- **Animations**: Framer Motion.
- **AI**: Google Gemini 2.0 Flash (`@google/generative-ai`).

## Commands
- `npm run dev` — dev server at `localhost:3000`
- `npm run build` — zero-TS-errors required
- `npm run lint` — runs `eslint` (not `next lint`); ESLint v9 flat config in `eslint.config.mjs`
- No test framework installed.

## Key quirks
- **`src/proxy.ts`** exports a custom `proxy` function — NOT a Next.js `middleware.ts`. It wraps `@supabase/ssr` createServerClient.
- **`next.config.ts`** has `allowedDevOrigins: ['192.168.1.108']` — the dev server is accessed from a mobile device on the LAN.
- **PostCSS** uses `@tailwindcss/postcss` (Tailwind v4 PostCSS plugin).
- **CSS import order** in `globals.css`: `@import "tailwindcss"` → `@import "tw-animate-css"` → `@import "shadcn/tailwind.css"`.
- **`ai-context/`** directory is reference material — never modify.
- **Supabase migration** at `supabase/migrations/202605250001_initial_schema.sql` — run in Supabase SQL editor.
- **Env file** `.env.local` is gitignored but contains real credentials — do not commit or expose.
- Mobile-first at 390px base width. Warm spiritual aesthetic (saffron/olive, no cold blues).
