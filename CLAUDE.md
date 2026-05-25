# Bhojan — Master AI Agent Context

## What This Product Is
Bhojan is a religious dietary compliance and observance intelligence platform.
It is NOT a restaurant discovery app.
It is NOT a generic food scanner.
It is a persistent, practice-aware compliance system that understands religious rules at the ingredient level.

## Core Value Proposition
"AI today understands language. Bhojan understands practice."

## The One Demo Flow
This is the ONLY flow that matters for the hackathon.
Every component you build must support this flow.

1. User opens app
2. User signs up and completes 3-step onboarding
3. User selects religious tradition (Satvik, Jain, Halal, Kosher, Christian Fasting, Custom)
4. User adds allergies and personal dislikes
5. User lands on dashboard with upcoming observance banner
6. User taps "Scan Menu"
7. User uploads Italian restaurant menu image
8. App shows pulsing amber scanning animation
9. AI analyzes ingredients against user's religious profile
10. Compliance cards reveal with staggered animation
11. Each card shows: dish name, status badge, confidence %, violation reason, hidden risk, alternatives
12. Observance alert appears: "Ekadashi in 2 days — grains will be restricted"
13. Kit suggestion appears: "Order your Vrat Essentials Kit"
14. Mock checkout confirmation

## Tech Stack
- Framework: Next.js 14 with App Router
- Language: TypeScript (strict mode always)
- Styling: Tailwind CSS
- Components: shadcn/ui
- Animation: Framer Motion
- Auth: Supabase Auth
- Database: Supabase (PostgreSQL)
- Storage: Supabase Storage
- - AI: Google Gemini 2.0 Flash with Vision (free tier via @google/generative-ai)
- Hosting: Vercel
- State: React useState/useContext (no external state library needed)

## Project Structure
```
src/
  app/
    (auth)/
      login/page.tsx
      signup/page.tsx
    onboarding/page.tsx
    dashboard/page.tsx
    scan/page.tsx
    observance/page.tsx
    marketplace/page.tsx
    api/
      scan/route.ts
      profile/route.ts
      observance/route.ts
  components/
    ui/              (shadcn components - do not edit)
    scanner/         (upload, animation, results)
    compliance/      (dish cards, status badges)
    observance/      (calendar, banners, alerts)
    marketplace/     (kit cards, product grid)
    layout/          (navbar, bottom nav, page wrapper)
  lib/
    openai.ts
    supabase.ts
    rules-engine.ts
    observance-data.ts
    utils.ts
  types/
    index.ts
ai-context/          (this folder - never modify during build)
public/
  demo/
    sample_scan_result.json
    italian_menu_text.txt
```

## Design System
See ui-rules.md for full details.

Colors:
- Background: #FAFAF7
- Surface: #FFFFFF
- Primary accent: #C17A2E (saffron gold)
- Secondary: #4A6741 (deep olive)
- Violation: #C0392B
- Safe: #2E7D5B
- Warning: #B8860B
- Uncertain: #888888
- Text primary: #1A1A1A
- Text secondary: #666666
- Border: #E8E3DC

Fonts:
- Headings: Playfair Display
- Body: DM Sans
- Monospace: JetBrains Mono

## Compliance Status System
- SAFE: confirmed compliant, high confidence
- WARNING: likely violates but not confirmed (e.g. seasoning may contain garlic)
- VIOLATION: confirmed ingredient present that violates practice
- UNCERTAIN: cannot determine compliance from menu description alone

## Agent Rules
1. Build ONLY the component or file specified in the task
2. Never modify files outside the specified scope
3. Always use TypeScript strict mode
4. Always mobile-first (390px base width)
5. Always use components from shadcn/ui before writing custom ones
6. Always use Framer Motion for transitions and animations
7. Always match the warm spiritual aesthetic — no cold blues, no generic SaaS styling
8. Commit after every working component
