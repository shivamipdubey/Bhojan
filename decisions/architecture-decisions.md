# Architecture Decisions

## AD-001: Next.js API Routes over FastAPI
Reason: Single deployment on Vercel, no CORS issues, faster to build.
Date: May 25, 2026

## AD-002: Supabase for auth and database
Reason: Built-in RLS, free tier, works natively with Next.js SSR via @supabase/ssr.
Date: May 25, 2026

## AD-003: Google Gemini 2.0 Flash for menu scanning
Reason: Free tier (1500 req/day), supports vision/image input, returns structured text.
Date: May 25, 2026

## AD-004: Framer Motion for all animations
Reason: Best React animation library, excellent stagger support, declarative API.
Date: May 25, 2026

## AD-005: Fallback to demo JSON if API fails
Reason: Demo reliability is non-negotiable. API failure during live demo = disaster avoided.
Date: May 25, 2026

## AD-006: No external state management library
Reason: React useState and Context is sufficient for hackathon scope. Keeps bundle small.
Date: May 25, 2026
