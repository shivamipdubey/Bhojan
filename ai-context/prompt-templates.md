# Bhojan — Prompt Templates

Copy these prompts directly into Codex or Antigravity.
Do not modify the structure. Only fill in the [VARIABLE] placeholders.

---

## MENU ANALYSIS SYSTEM PROMPT
Use this as the first argument inside model.generateContent() in /api/scan/route.ts

```
You are Bhojan's religious dietary compliance engine.

Your job is to analyze restaurant menu items for compliance with a specific religious dietary practice.

CRITICAL RULES:
1. Return ONLY valid JSON. No preamble, no explanation, no markdown code blocks, no backticks.
2. Be specific about WHY an ingredient violates the practice. Never say "may contain animal products" without naming the specific ingredient.
3. Use UNCERTAIN when you cannot determine compliance from the menu text alone. Never falsely assure SAFE.
4. Hidden risks are ingredients that commonly appear in this dish type but are not mentioned on the menu.
5. Alternatives must be practical and ideally from the same menu or cuisine style.

STATUS DEFINITIONS:
- "safe": confirmed compliant with high confidence
- "warning": likely violates but not confirmed (e.g. "house seasoning" may contain garlic)
- "violation": confirmed ingredient present that violates practice
- "uncertain": cannot determine compliance from menu description

CONFIDENCE SCORING:
- 0.85-1.0: ingredient explicitly stated, or industry standard that it is present
- 0.60-0.84: common in this cuisine but not confirmed
- 0.40-0.59: possible but not typical
- Below 0.40: flag as uncertain

Return this exact JSON structure and nothing else:
{
  "restaurant": "restaurant name if visible on menu, or null",
  "dishes": [
    {
      "name": "exact dish name from menu",
      "status": "safe | warning | violation | uncertain",
      "confidence": 0.0,
      "violations": ["specific ingredient name"],
      "violationReason": "plain English explanation of why this violates the practice",
      "hiddenRisk": "specific hidden ingredient to watch for, or null if none",
      "alternatives": ["safer alternative 1", "safer alternative 2"],
      "observanceNote": "if current observance changes this recommendation, explain here, otherwise null"
    }
  ],
  "overallSafety": "safe | caution | avoid",
  "observanceAlert": "if upcoming observance is relevant to this menu, brief note, otherwise null"
}
```

---

## CODEX PROMPTS — COPY AND USE DIRECTLY

### GEMINI CLIENT SETUP
```
Build ONLY the Gemini AI client setup file at src/lib/gemini.ts.

Use the @google/generative-ai package.
API key comes from process.env.GEMINI_API_KEY

File contents:
1. Import GoogleGenerativeAI from '@google/generative-ai'
2. Throw an error if GEMINI_API_KEY is not set
3. Export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
4. Export function getVisionModel() that returns genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

TypeScript strict mode. Do not create any other files.
```

### AUTH SETUP
```
Build ONLY the Supabase authentication setup.

Files to create:
1. src/lib/supabase/client.ts — browser client using createBrowserClient from @supabase/ssr
2. src/lib/supabase/server.ts — server client using createServerClient from @supabase/ssr with cookies from next/headers
3. src/app/(auth)/login/page.tsx — email and password login form
4. src/app/(auth)/signup/page.tsx — email and password signup form
5. src/middleware.ts — protect all routes except (auth) and public assets

Middleware logic:
- Allow without auth: /login, /signup, /onboarding, /, /api/*, /_next/*, /public/*
- If no session AND accessing any other route: redirect to /login
- If session exists AND no row in profiles table AND accessing /dashboard: redirect to /onboarding

Login page behavior:
- On success: check if profile exists in Supabase profiles table
  - Profile exists: redirect to /dashboard
  - No profile: redirect to /onboarding
- On error: show inline error message below the form

Signup page behavior:
- On success: redirect to /onboarding
- On error: show inline error message

server.ts pattern:
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
              cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
}
```

Design: follow ai-context/ui-rules.md — warm minimal, Playfair Display headings, DM Sans body, saffron accent buttons
Mobile-first 390px width. Cards centered with max-w-sm mx-auto on a #FAFAF7 background.

Do not create any other files. TypeScript strict mode.
```

### ONBOARDING FLOW
```
Build ONLY the onboarding flow at src/app/onboarding/page.tsx.
This is a client component ('use client').

3-step flow with animated step indicator at top showing current step out of 3.

STEP 1 — Welcome:
- "Bhojan" in Playfair Display font, 32px, color #C17A2E (saffron)
- Tagline: "Your practice. Your plate." in DM Sans
- Subtext: "Set up once. Know what you can eat anywhere in the world."
- "Get Started" button — rounded-full, bg-[#C17A2E], white text

STEP 2 — Choose Your Tradition:
- Heading: "What is your practice?"
- Card grid (2 columns) with these options:
  { id: "satvik", label: "Satvik / Hindu", description: "No onion, garlic, meat, eggs, mushrooms" }
  { id: "jain", label: "Jain", description: "No root vegetables, onion, garlic, meat, mushrooms" }
  { id: "halal", label: "Halal", description: "No pork, no alcohol, halal-certified meat only" }
  { id: "kosher", label: "Kosher", description: "No pork, no shellfish, no meat with dairy" }
  { id: "christian", label: "Christian Fasting", description: "Lent, Good Friday, Orthodox fasting" }
  { id: "custom", label: "Custom", description: "Build your own dietary rules" }
- Selected card: border-2 border-[#C17A2E] bg-[#FFF8E1]
- Unselected card: border border-[#E8E3DC] bg-white
- "Continue" button disabled until one card is selected

STEP 3 — Personalize:
- Section 1 heading: "Food allergies"
  Chip options: Nuts, Dairy, Gluten, Soy, Shellfish, Sesame, Other
  Chips toggle on/off. Selected chip: bg-[#C17A2E] text-white. Unselected: bg-white border
- Section 2 heading: "I also don't eat"
  Text input — on Enter key or comma, text becomes a chip below the input
  Each chip has an X button to remove it
- "Complete Setup" button — always active

On completion:
- POST to /api/profile with { tradition, allergies, dislikes }
- Show brief loading spinner inside the button
- Redirect to /dashboard on success

Transitions between steps: Framer Motion
- Exit: x: -40, opacity: 0, duration: 0.2
- Enter: x: 40, opacity: 0 → x: 0, opacity: 1, duration: 0.2

Use design system from ai-context/ui-rules.md.
TypeScript strict mode. Mobile-first 390px.
```

### DASHBOARD
```
Build ONLY the dashboard at src/app/dashboard/page.tsx.
This is a server component that fetches data server-side using Supabase server client.

Data to fetch (server-side from Supabase):
1. User profile from profiles table using auth.uid()
2. Last 3 scan records from scans table ordered by created_at desc
3. Upcoming observances for user's tradition within next 14 days from observances table

Page layout (top to bottom, mobile-first, max-w-md mx-auto, px-4):

1. Top bar:
   - Left: "Good morning, [first name from email or 'there']" in Playfair Display
   - Right: Avatar circle with user initials, bg-[#C17A2E], white text

2. Observance banner (only render if an observance exists within 7 days):
   - bg-[#FFF8E1] rounded-2xl p-4 border border-[#B8860B]/20
   - Left: amber dot + "[observanceName] in [N] days" bold
   - Below: brief dietary change note
   - Right: X button to dismiss (make this a client component island)
   - Below: "Order Prep Kit →" in text-[#C17A2E]

3. Primary scan CTA card:
   - Large card, bg-[#C17A2E], rounded-2xl, p-8, text-white
   - ScanLine icon (32px) + "Scan a Menu" heading
   - Subtext: "Find out what you can eat"
   - Full card is a link to /scan

4. Quick actions row (2 equal cards side by side):
   - "My Calendar" card → link to /observance
   - "Ritual Shop" card → link to /marketplace

5. Recent Scans section:
   - Heading: "Recent Scans" in Playfair Display
   - If scans exist: list of last 3 with restaurant name, date, colored dot for overallSafety
     Green dot = safe, Amber = caution, Red = avoid
   - If no scans: "Scan your first menu to see results here." in text-secondary

Show Skeleton components while data loads (use shadcn Skeleton).
Bottom navigation bar: 4 items — Home (active), Scan, Observance, Profile.
Import BottomNav from @/components/layout/BottomNav.

Use design system from ai-context/ui-rules.md. TypeScript strict mode. Mobile-first.
```

### MENU SCAN PAGE
```
Build ONLY the scan page at src/app/scan/page.tsx.
This is a client component ('use client').

Manage state with useState. 4 possible states: 'upload' | 'preview' | 'scanning' | 'results'

STATE: upload (default)
- Full screen centered layout
- Dashed border upload zone: border-2 border-dashed border-[#C17A2E]/40 rounded-2xl p-12
- ScanLine icon (48px, color #C17A2E) centered
- "Upload a menu" heading
- "Take a photo or upload an image" subtext in text-secondary
- Hidden file input accepting image/jpeg, image/png, image/webp
- Entire zone is clickable to trigger file input
- Below zone: "Try Demo" text link (text-[#C17A2E] underline) — calls handleDemoMode()

STATE: preview
- Thumbnail of uploaded image (max-h-48, object-contain, rounded-xl)
- "Ready to analyze" text
- "Scan this menu" button — saffron, full width, rounded-full
- "Choose different image" text link below

STATE: scanning
- Centered pulsing amber ring animation:
  <motion.div
    className="w-24 h-24 rounded-full border-4 border-[#C17A2E]"
    animate={{ scale: [1, 1.15, 1], opacity: [1, 0.5, 1] }}
    transition={{ duration: 1.8, repeat: Infinity }}
  />
- "Analyzing your menu..." text below
- "Checking for hidden ingredients..." subtext in text-secondary
- Indeterminate progress bar (shadcn Progress, animated)

STATE: results
- Restaurant name at top (or "Your Menu" if null) in Playfair Display
- Summary bar: "[N] Safe · [N] Warnings · [N] Violations · [N] Uncertain"
  Each segment colored with its status color
- Filter chips row: All / Safe / Warning / Violation / Uncertain
  Active chip: bg-[#C17A2E] text-white. Inactive: bg-white border
- Filtered list of ComplianceDishCard components with Framer Motion stagger
- If scanResult.observanceAlert: amber banner below cards
- If upcoming observance within 10 days: KitSuggestion component at bottom

Demo mode logic:
- handleDemoMode(): set state to 'scanning', after 2000ms timeout fetch from
  /demo/sample_scan_result.json and set state to 'results'
- Also activate demo mode if URL search param ?demo=true on page mount

Real scan logic:
- Convert file to base64 using FileReader
- fetch POST to /api/scan with { imageBase64, mimeType, profile }
- On success: set results
- On error or timeout (>15s): load sample_scan_result.json as fallback

Get user profile from Supabase browser client on mount.

Use design system from ai-context/ui-rules.md. TypeScript strict mode. Mobile-first.
```

### COMPLIANCE DISH CARD
```
Build ONLY the ComplianceDishCard component at src/components/compliance/ComplianceDishCard.tsx.

Props interface (export this):
interface ComplianceDishCardProps {
  name: string
  status: 'safe' | 'warning' | 'violation' | 'uncertain'
  confidence: number
  violations: string[]
  violationReason: string
  hiddenRisk: string | null
  alternatives: string[]
  observanceNote: string | null
  index: number
}

Status color map to use inside the component:
const STATUS_STYLES = {
  safe:      { bg: '#EDF7F2', text: '#2E7D5B', border: '#2E7D5B', label: 'SAFE' },
  warning:   { bg: '#FFF8E1', text: '#B8860B', border: '#B8860B', label: 'WARNING' },
  violation: { bg: '#FDECEA', text: '#C0392B', border: '#C0392B', label: 'VIOLATION' },
  uncertain: { bg: '#F5F5F5', text: '#888888', border: '#888888', label: 'UNCERTAIN' },
}

Card structure (rounded-2xl, bg-white, shadow-sm, border border-[#E8E3DC], overflow-hidden):
LEFT ACCENT: 4px wide div on the left edge, height 100%, background = STATUS_STYLES[status].border

CONTENT (p-4, flex-1):
Row 1: dish name (text-base font-medium) LEFT + status badge RIGHT
  Badge: px-3 py-1 rounded-full text-xs font-semibold
  Badge bg/text colors from STATUS_STYLES[status]

Row 2: confidence percentage
  Format: "{Math.round(confidence * 100)}% confident"
  text-xs font-mono text-[#888888]

Row 3 (only if violations.length > 0):
  XCircle icon (14px, #C0392B) + violations.join(', ')
  text-[13px] text-[#C0392B]

Row 4 (only if violationReason):
  text-[13px] text-[#666666]
  Max 2 lines with line-clamp-2

Row 5 (only if hiddenRisk):
  AlertCircle icon (14px, #B8860B) + "Watch for: " + hiddenRisk
  text-[12px] italic text-[#B8860B]

Row 6 (only if alternatives.length > 0):
  Shadcn Collapsible, default closed
  Trigger: "See safer options" with ChevronDown/Up icon
  Content: alternatives as grey pill chips (bg-[#F5F5F5] rounded-full px-3 py-1 text-xs)

Row 7 (only if observanceNote):
  Calendar icon (14px, #4A6741) + observanceNote text
  text-[12px] text-[#4A6741] bg-[#F0F5EE] rounded-lg px-3 py-2

FRAMER MOTION:
Wrap entire card in motion.div with variants:
  hidden: { opacity: 0, y: 12 }
  show: { opacity: 1, y: 0, transition: { duration: 0.2, delay: index * 0.05 } }
Parent list must use variants with staggerChildren: 0.05

Do not create any other files. TypeScript strict mode.
```

### SCAN API ROUTE
```
Build ONLY the scan API route at src/app/api/scan/route.ts.

This is a Next.js App Router API route (POST method).

Use Google Gemini 2.0 Flash via the @google/generative-ai package.
Import getVisionModel from @/lib/gemini

Input (POST request body JSON):
{
  imageBase64: string          // base64 image, no data URI prefix
  mimeType: string             // "image/jpeg" | "image/png" | "image/webp"
  profile: {
    tradition: string
    subTradition: string | null
    allergies: string[]
    dislikes: string[]
    activeObservances: string[]
  }
}

Implementation steps:
1. Parse request body with request.json()
2. Validate that imageBase64 and profile.tradition exist, return 400 if missing
3. Get model: const model = getVisionModel()
4. Build image part:
   const imagePart = { inlineData: { data: imageBase64, mimeType } }
5. Build user prompt string:
   "Analyze this menu for [tradition] dietary compliance.
    User allergies: [allergies joined].
    User personal dislikes: [dislikes joined].
    Active observances today: [activeObservances joined].
    Return JSON only. No markdown, no backticks, no explanation outside JSON."
6. Call Gemini:
   const result = await model.generateContent([SYSTEM_PROMPT, imagePart, userPrompt])
   const rawText = result.response.text()
   const cleanText = rawText.replace(/```json|```/g, '').trim()
   const geminiResult = JSON.parse(cleanText)
7. Add counts to result:
   safeCount, warningCount, violationCount, uncertainCount from dishes array
8. Add scanId: crypto.randomUUID()
9. Save to Supabase scans table (wrap in try/catch, don't fail if save fails)
10. Return NextResponse.json(finalResult)

SYSTEM_PROMPT constant: paste the full MENU ANALYSIS SYSTEM PROMPT from this file at the top of route.ts

Timeout handling:
Wrap the Gemini call in a Promise.race with a 15 second timeout.
If timeout: return NextResponse.json({ error: 'Timeout', fallback: true }, { status: 408 })

Full error handling:
- JSON parse error: return 500 with { error: 'Invalid response format', fallback: true }
- Gemini API error: return 500 with { error: 'Analysis failed', fallback: true }
- Any error with fallback: true tells the frontend to load sample_scan_result.json

TypeScript strict mode. Do not create other files.
```

### GEMINI CLIENT FILE
```
Build ONLY the Gemini client file at src/lib/gemini.ts.

Contents:
import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set')
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const getVisionModel = () =>
  genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 2048,
    },
  })

TypeScript strict mode. Do not create other files.
```

### PROFILE API ROUTE
```
Build ONLY the profile API routes at src/app/api/profile/route.ts.

GET handler:
- Get Supabase server client
- Get current user from auth
- If no user: return 401
- Fetch profile from profiles table where id = user.id
- Return profile as JSON

POST handler:
- Get Supabase server client
- Get current user from auth
- If no user: return 401
- Parse body: { tradition, allergies, dislikes }
- Upsert into profiles table (insert if not exists, update if exists)
- Return updated profile as JSON

TypeScript strict mode. Do not create other files.
```

### OBSERVANCE DATA FILE
```
Build ONLY the observance data file at src/lib/observance-data.ts.

Export this TypeScript interface:
export interface Observance {
  id: string
  tradition: string
  name: string
  description: string
  startDate: string
  endDate: string | null
  dietaryChanges: string[]
  ritualItems: string[]
  isRecurring: boolean
  nextOccurrence: string
}

Export const OBSERVANCES: Observance[] with these entries:
1. { id:'ekadashi', tradition:'satvik', name:'Ekadashi', description:'11th day of lunar fortnight, no grains or beans', startDate:'2026-05-27', endDate:'2026-05-27', dietaryChanges:['No grains (rice, wheat, oats)','No beans or lentils','Rock salt only','Fruits and dairy allowed','Sabudana and buckwheat permitted'], ritualItems:['Sabudana','Sendha namak','Fresh fruits','Dry fruits'], isRecurring:true, nextOccurrence:'2026-05-27' }
2. { id:'navratri', tradition:'satvik', name:'Navratri', description:'Nine nights of Goddess Durga worship with special fasting', startDate:'2026-10-02', endDate:'2026-10-10', dietaryChanges:['No grains','No onion or garlic','No meat','Rock salt only','Buckwheat and singhara flour allowed'], ritualItems:['Coconut','Mango leaves','Banana leaves','Sabudana','Kuttu atta','Flowers','Kumkum'], isRecurring:true, nextOccurrence:'2026-10-02' }
3. { id:'ramadan', tradition:'halal', name:'Ramadan', description:'Month of fasting from dawn to sunset', startDate:'2027-02-17', endDate:'2027-03-19', dietaryChanges:['No food or drink from Fajr to Maghrib','Suhoor before dawn','Iftar at sunset with dates and water','All regular Halal rules apply'], ritualItems:['Dates','Vermicelli','Rose water','Dry fruits'], isRecurring:true, nextOccurrence:'2027-02-17' }
4. { id:'passover', tradition:'kosher', name:'Passover', description:'No leavened bread for 7-8 days', startDate:'2027-04-01', endDate:'2027-04-08', dietaryChanges:['No leavened bread or pasta','No grains that have risen','Matzah replaces bread','No beans or rice (Ashkenazi)'], ritualItems:['Matzah','Bitter herbs','Charoset ingredients','Parsley'], isRecurring:true, nextOccurrence:'2027-04-01' }
5. { id:'good-friday', tradition:'christian', name:'Good Friday', description:'Day of fasting and abstinence', startDate:'2027-04-01', endDate:'2027-04-01', dietaryChanges:['No meat','One full meal only','Fish permitted'], ritualItems:[], isRecurring:true, nextOccurrence:'2027-04-01' }
6. { id:'paryushana', tradition:'jain', name:'Paryushana', description:'Annual festival of forgiveness with strictest dietary rules', startDate:'2026-08-20', endDate:'2026-08-28', dietaryChanges:['No green vegetables','Only dry or stored grains','No eating outside home for strict observers','All standard Jain rules apply strictly'], ritualItems:[], isRecurring:true, nextOccurrence:'2026-08-20' }
7. { id:'yom-kippur', tradition:'kosher', name:'Yom Kippur', description:'Day of Atonement, complete fast', startDate:'2026-10-01', endDate:'2026-10-02', dietaryChanges:['No food or drink for 25 hours','Complete fast from sundown to nightfall'], ritualItems:[], isRecurring:true, nextOccurrence:'2026-10-01' }

Export this function:
export function getUpcomingObservances(tradition: string, daysAhead: number): Observance[] {
  const today = new Date()
  const future = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000)
  return OBSERVANCES
    .filter(o => o.tradition === tradition)
    .filter(o => {
      const next = new Date(o.nextOccurrence)
      return next >= today && next <= future
    })
    .sort((a, b) => new Date(a.nextOccurrence).getTime() - new Date(b.nextOccurrence).getTime())
}

TypeScript strict mode. Do not create other files.
```

---

## ANTIGRAVITY PARALLEL AGENT PROMPTS

### Parallel Set 1 — Run simultaneously, these files do not depend on each other

Agent 1 — MenuUpload Component:
```
Using the Bhojan codebase, build ONLY the MenuUpload component
at src/components/scanner/MenuUpload.tsx.

This is a client component ('use client').

Props:
interface MenuUploadProps {
  onFileSelect: (file: File) => void
  isScanning: boolean
  onDemoMode: () => void
}

When isScanning is false — show upload zone:
- Dashed border zone: border-2 border-dashed border-[#C17A2E]/40 rounded-2xl p-12 cursor-pointer
- ScanLine icon from lucide-react (48px, color #C17A2E) centered
- "Upload a menu" in text-lg font-medium
- "Take a photo or upload an image" in text-sm text-[#666666]
- Hidden file input (accept="image/jpeg,image/png,image/webp")
- Entire zone onClick triggers file input click
- onChange: validate max 10MB, if over show error toast using sonner, else call onFileSelect(file)
- Below zone: "Try Demo" text link (text-sm text-[#C17A2E] underline) onClick calls onDemoMode

When isScanning is true — show scanning animation:
- Same zone dimensions, centered content
- Pulsing amber ring:
  <motion.div
    className="w-20 h-20 rounded-full border-4 border-[#C17A2E]"
    animate={{ scale: [1, 1.15, 1], opacity: [1, 0.4, 1] }}
    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
  />
- "Analyzing..." text below animation

Use design system from ai-context/CLAUDE.md.
Use Framer Motion for animations. Use sonner for toasts.
TypeScript strict mode. Mobile-first.
Do not touch any other files.
```

Agent 2 — ObservanceBanner Component:
```
Using the Bhojan codebase, build ONLY the ObservanceBanner component
at src/components/observance/ObservanceBanner.tsx.

This is a client component ('use client').

Props:
interface ObservanceBannerProps {
  observanceName: string
  tradition: string
  daysUntil: number
  dietaryChanges: string[]
  onDismiss: () => void
  onOrderKit: () => void
}

Layout (rounded-2xl p-4 bg-[#FFF8E1] border border-[#B8860B]/20):
Row 1: 
  Left: amber dot (w-2 h-2 rounded-full bg-[#B8860B]) + bold text "[observanceName] in [daysUntil] day(s)"
  Right: X button (XCircle icon, onClick calls onDismiss)
Row 2:
  "Changes: [first 2 dietaryChanges joined with ' · ']"
  text-[13px] text-[#666666]
Row 3:
  "Order Prep Kit →" text button, text-[#C17A2E] text-[13px] font-medium, onClick calls onOrderKit

Framer Motion:
Mount animation: initial={{ y: -16, opacity: 0 }}, animate={{ y: 0, opacity: 1 }}, duration: 0.25
Dismiss animation: use AnimatePresence with exit={{ y: -16, opacity: 0 }}

TypeScript strict mode. Mobile-first. Do not touch any other files.
```

Agent 3 — KitSuggestion Component:
```
Using the Bhojan codebase, build ONLY the KitSuggestion component
at src/components/marketplace/KitSuggestion.tsx.

This is a client component ('use client').

Props:
interface KitSuggestionProps {
  observanceName: string
  items: Array<{ name: string; price: number; imageUrl: string | null }>
  onOrderKit: () => void
}

Layout (rounded-2xl bg-white shadow-sm border border-[#E8E3DC] overflow-hidden):
Left accent: 4px solid bg-[#4A6741] (olive green)
Content (p-4):
  Heading: "Prepare for [observanceName]" in Playfair Display text-lg
  Subtext: "[observanceName] is approaching. Here are the essentials." text-[13px] text-secondary
  
  Horizontal scroll row (flex overflow-x-auto gap-3 pb-2 mt-3):
  Each product mini-card (min-w-[100px] rounded-xl border border-[#E8E3DC] p-2):
    - Image: if imageUrl exists show img, else show grey placeholder (w-full h-16 bg-[#F5F0E8] rounded-lg)
    - Product name: text-[12px] font-medium mt-1 line-clamp-2
    - Price: text-[12px] text-[#C17A2E] font-medium

  "Order Kit" button: full width, rounded-full, bg-[#C17A2E], text-white, mt-3
    On click: call onOrderKit() AND show sonner toast("Kit added! We'll notify you when ready. 🙏")

Framer Motion:
Mount: initial={{ opacity: 0, y: 16 }}, animate={{ opacity: 1, y: 0 }}, duration: 0.3

TypeScript strict mode. Mobile-first. Do not touch any other files.
```

---

## DEBUG PROMPTS

### Fix TypeScript error
```
Fix ONLY this TypeScript error in [FILE_PATH]:

Error message: [PASTE EXACT ERROR FROM TERMINAL]
Line number: [LINE NUMBER]

What this file does: [one sentence description]

Rules:
- Fix only the type error on that specific line
- Do not change any logic, functionality, or other lines
- Show me only the corrected section, not the entire file
```

### Fix UI layout issue
```
Fix ONLY the layout issue in [FILE_PATH].

Problem: [describe exactly what looks wrong — e.g. "text overflows the card on mobile"]
Screen size: [390px mobile / desktop]
Expected: [describe what it should look like]

Rules:
- Fix only the layout/spacing issue
- Do not change colors, animations, or logic
- Do not modify any other files
```

### Add loading skeleton
```
Add ONLY a loading skeleton to [FILE_PATH].

Show [N] skeleton placeholder cards while data is loading.
Each skeleton should match the approximate height of the real content.

Skeleton style to use:
<div className="rounded-2xl bg-[#F5F0E8] h-[Npx] animate-pulse" />

Wrap in a conditional: if (loading) return <skeletons />, else return <real content />
Do not change any existing logic, data fetching, or styling.
```

### Fix broken import
```
Fix ONLY the import error in [FILE_PATH].

Error: [paste error]

The component being imported is at [correct file path].
Update only the import statement. Do not change anything else.
```