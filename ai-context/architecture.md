# Bhojan — Technical Architecture

---

## SYSTEM OVERVIEW

```
User Device (Mobile Browser)
        ↓
   Next.js App (Vercel)
        ↓
   Next.js API Routes
        ↓
   ┌────────────────────┐
   │  Google Gemini 2.0 │  ← Vision API for menu scanning
   │  Flash (Free Tier) │
   └────────────────────┘
        ↓
   Rules Engine (lib/rules-engine.ts)
        ↓
   Structured JSON Output
        ↓
   Supabase PostgreSQL   ← Profile, scan history, observances
```

---

## FRONTEND ARCHITECTURE

### Framework
Next.js 14 with App Router
All pages use React Server Components by default
Client Components only where interactivity is needed (forms, animations, real-time state)

### File Conventions
- page.tsx = route page (server component unless 'use client' at top)
- layout.tsx = shared layout wrapper
- loading.tsx = loading skeleton for that route
- error.tsx = error boundary for that route
- route.ts = API endpoint

### State Management
No external state library (Zustand, Redux) needed for hackathon scope.
Use React useState for local component state.
Use React Context for user profile (needed across many components).

```tsx
// src/lib/contexts/ProfileContext.tsx
// Stores: tradition, allergies, dislikes, upcomingObservances
// Loaded once on app mount from Supabase
// Consumed by: dashboard, scanner, observance components
```

### Data Fetching
Server components fetch directly from Supabase server client.
Client components use useEffect with Supabase browser client.
API routes for Gemini calls (keeps API key server-side only).

---

## BACKEND ARCHITECTURE

### API Routes

#### POST /api/scan
Purpose: Analyze menu image for compliance
Input:
```json
{
  "imageBase64": "string (base64 encoded image)",
  "mimeType": "image/jpeg | image/png | image/webp",
  "profile": {
    "tradition": "satvik | jain | halal | kosher | christian | custom",
    "subTradition": "string | null",
    "allergies": ["string"],
    "dislikes": ["string"],
    "activeObservances": ["string"]
  }
}
```
Output:
```json
{
  "restaurant": "string (auto-detected from menu or null)",
  "scanId": "uuid",
  "dishes": [
    {
      "name": "string",
      "status": "safe | warning | violation | uncertain",
      "confidence": 0.0,
      "violations": ["ingredient name"],
      "violationReason": "string",
      "hiddenRisk": "string | null",
      "alternatives": ["string"],
      "observanceNote": "string | null"
    }
  ],
  "overallSafety": "safe | caution | avoid",
  "observanceAlert": "string | null",
  "safeCount": 0,
  "warningCount": 0,
  "violationCount": 0,
  "uncertainCount": 0
}
```

#### GET /api/profile
Purpose: Get current user's religious profile
Auth: Requires Supabase session cookie
Output: Profile object from database

#### POST /api/profile
Purpose: Create or update user's religious profile
Input: Profile fields
Output: Updated profile

#### GET /api/observances
Purpose: Get upcoming observances for user's tradition
Query params: tradition, days (default: 30)
Output: Array of upcoming observance objects

---

## DATABASE SCHEMA

### Table: profiles
```sql
create table profiles (
  id uuid references auth.users primary key,
  tradition text not null,
  sub_tradition text,
  allergies text[] default '{}',
  dislikes text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);
```

### Table: scans
```sql
create table scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  restaurant_name text,
  scan_result jsonb not null,
  created_at timestamptz default now()
);

alter table scans enable row level security;
create policy "Users can view own scans"
  on scans for select using (auth.uid() = user_id);
create policy "Users can insert own scans"
  on scans for insert with check (auth.uid() = user_id);
```

### Table: observances
```sql
create table observances (
  id uuid primary key default gen_random_uuid(),
  tradition text not null,
  name text not null,
  description text,
  start_date date not null,
  end_date date,
  dietary_rules jsonb,
  ritual_items text[] default '{}',
  is_recurring boolean default false,
  recurrence_rule text
);
-- No RLS needed, public data
```

### Table: marketplace_items
```sql
create table marketplace_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  traditions text[] default '{}',
  price decimal(10,2),
  image_url text,
  description text,
  observance_tags text[] default '{}'
);
-- No RLS needed, public data
```

---

## AI PIPELINE DETAIL

### Package
```
@google/generative-ai
```
Install: npm install @google/generative-ai

### Model
```
gemini-2.0-flash
```
Free tier limits: 15 requests/minute, 1500 requests/day.
More than sufficient for hackathon use.

### Step 1: Image Upload
User selects image from device.
Frontend converts file to base64 string using FileReader API.
Frontend sends POST to /api/scan with base64 string, mimeType, and user profile.

### Step 2: Gemini Vision Call
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

const imagePart = {
  inlineData: {
    data: imageBase64,       // base64 string, NO data:image/jpeg;base64, prefix
    mimeType: mimeType,      // "image/jpeg" | "image/png" | "image/webp"
  },
}

const result = await model.generateContent([
  COMPLIANCE_SYSTEM_PROMPT,
  imagePart,
  `Analyze this menu for ${tradition} dietary compliance.
   User allergies: ${allergies.join(', ')}.
   User dislikes: ${dislikes.join(', ')}.
   Active observances: ${activeObservances.join(', ')}.
   Return JSON only. No markdown. No explanation outside the JSON.`
])

const rawText = result.response.text()
const cleanText = rawText.replace(/```json|```/g, '').trim()
const parsed = JSON.parse(cleanText)
```

### Step 3: Rules Engine Validation
After Gemini returns results, run through local rules engine at src/lib/rules-engine.ts.
Cross-check AI output against religion-rules.md data.
Catch violations the AI may have missed.
Validate allergy conflicts not caught by AI.
Adjust confidence scores using domain knowledge.

### Step 4: Save and Return
Save full result to Supabase scans table as JSONB.
Return structured JSON to frontend.
Frontend renders compliance cards with stagger animation.

### Fallback
If Gemini call fails, times out (>15 seconds), or JSON parse fails:
Load from /public/demo/sample_scan_result.json
Set isDemoMode: true in the response
Frontend shows small "Demo results" label
This ensures demo never fails regardless of API status.

---

## GEMINI CLIENT SETUP

### src/lib/gemini.ts
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables')
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const getVisionModel = () =>
  genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
```

---

## AUTHENTICATION FLOW

```
User visits /
  → Check Supabase session
  → No session: redirect to /login
  → Session exists, no profile: redirect to /onboarding
  → Session + profile: redirect to /dashboard

Signup flow:
  /signup → create Supabase auth user
  → redirect to /onboarding
  → complete 3-step onboarding
  → create profile in profiles table
  → redirect to /dashboard

Login flow:
  /login → Supabase email+password auth
  → check if profile exists
  → profile exists: /dashboard
  → no profile: /onboarding
```

### Middleware (src/middleware.ts)
```typescript
// Protect all routes except (auth) and public routes
// Redirect unauthenticated users to /login
// Redirect users with no profile to /onboarding
```

---

## SUPABASE CLIENT SETUP

### src/lib/supabase/client.ts
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

### src/lib/supabase/server.ts
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

---

## ENVIRONMENT VARIABLES

Required in .env.local:
```
GEMINI_API_KEY=your_gemini_api_key_from_aistudio_google_com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Required in Vercel dashboard (production):
Same variables with production values.
GEMINI_API_KEY must be added as a server-side only variable (no NEXT_PUBLIC_ prefix).

How to get GEMINI_API_KEY:
1. Go to aistudio.google.com
2. Click "Get API Key" in top left
3. Click "Create API key"
4. Copy and paste into .env.local

---

## DEPLOYMENT

### Development
```bash
npm run dev
```
Runs on http://localhost:3000

### Production Build Check
```bash
npm run build
```
Fix ALL TypeScript errors before deploying.
Zero errors required before pushing to Vercel.

### Deploy to Vercel
```bash
npx vercel --prod
```
Or connect GitHub repo to Vercel dashboard for automatic deploys on push to main.

### Vercel Configuration
Framework: Next.js (auto-detected)
Node version: 20.x
Build command: npm run build
Output directory: .next
Install command: npm install

### Required Vercel Environment Variables
Add in Vercel dashboard under Settings → Environment Variables:
- GEMINI_API_KEY
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_APP_URL (set to your .vercel.app production URL)