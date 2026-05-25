# Bhojan — Product Document

## Problem Statement
35 million Indians live abroad. A significant portion follow religious dietary practices
stricter than "vegetarian" — satvik, Jain, Halal, Kosher, and others.

When they eat at restaurants abroad, they face a specific problem that no product solves today:
hidden ingredient violations. Garlic powder in a spice mix. Mushroom stock in a soup base.
Wine in a risotto. Animal-derived gelatin in a dessert. A waiter would never mention these.
Generic AI gives unreliable answers because it lacks ingredient-level knowledge of specific traditions.
More importantly, it forgets your practice every session.

## What Bhojan Is
Bhojan is a religious dietary compliance and observance intelligence platform.

You set up your practice profile once. The app builds your compliance rules from the actual
dietary codes of your tradition — not a generic "vegetarian" checkbox. It remembers your
practice permanently, knows your fasting calendar, and applies that knowledge everywhere:
restaurants, grocery stores, airline menus, and ritual shopping.

## Target Users
Primary: Indian diaspora in the US, UK, Canada, UAE
Secondary: Any observant community — Muslim, Jewish, Hindu, Jain, Orthodox Christian
Tertiary: Anyone with religion-adjacent dietary identity (ethical vegan, cultural restrictions)

## Founder Story
Shivam Dubey is an initiated Gaudiya Vaishnava following a strict satvik diet.
He navigated satvik compliance in Boston, Dubai, and on Emirates flights.
He knows exactly where the product fails because he lived the failure.
This is the opening line of every pitch.

## Core Features (Hackathon MVP Only)

### 1. Religious Profile Setup
User selects their tradition from: Satvik/Hindu, Jain, Halal, Kosher, Christian Fasting, Custom
User adds sub-tradition if applicable (e.g. Ekadashi observer, Paryushana, Ramadan)
User adds personal food allergies (nuts, dairy, gluten, soy, shellfish, etc.)
User adds personal dislikes (free text + chips)
Profile saved to Supabase, persists across sessions

### 2. Menu Scanner
User uploads menu image, PDF, or screenshot
OpenAI Vision API extracts all dishes and visible ingredients
Rules engine matches against user's religious profile
Returns structured compliance JSON with status, confidence, violations, hidden risks, alternatives
Results displayed as animated compliance cards

### 3. Compliance Cards
Each dish gets one card showing:
- Dish name
- Status badge: SAFE / WARNING / VIOLATION / UNCERTAIN
- Confidence percentage
- Which specific ingredient violates practice
- Why it violates (plain English)
- What hidden ingredient to watch for
- 1-2 safer alternatives
- Observance note if current fasting changes the rule

### 4. Observance Intelligence
App knows upcoming fasting days, festivals, and observances for user's tradition
Dashboard shows banner: "Ekadashi in 2 days — grains will be restricted"
Observance dynamically changes compliance rules on that day

### 5. Marketplace Kit Suggestion
After scan results, app shows relevant upcoming observance
Suggests a "kit" of 3-4 products needed for preparation
Mock checkout (no real payment for hackathon)

## What Is NOT in the Hackathon MVP
- Full marketplace with separate page
- Real payment processing
- Barcode scanning
- Airline meal integration
- Full calendar page (just dashboard banner)
- Every religion covered (focus on 4-5 for demo)
- Production delivery infrastructure

## Revenue Model (For Pitch)
1. Freemium — basic scanning free, premium unlocks live scan + full calendar sync
2. Marketplace — transaction margin on ritual items and ingredient kits
3. B2B API — compliance layer for airlines and travel platforms

## Pitch Line
"AI today understands language. Bhojan understands practice."

## Key Differentiators vs Generic AI
- Persistent profile (ChatGPT forgets your practice every session)
- Ingredient-level knowledge (not just "may contain animal products")
- Confidence scoring with reasoning (trustworthy, not pretending certainty)
- Observance-aware (rules change on fasting days)
- UNCERTAIN status (honest about what cannot be determined)
- Domain-specific religious knowledge base

## Emotional Demo Moment
User scans an Italian restaurant menu.
Mushroom Risotto card appears: VIOLATION — 94% confidence.
Reason: mushrooms violate satvik and Jain practice. Wine likely present in stock.
Hidden risk: "Risotto stock almost always includes white wine."
The user says: "It caught the wine. No waiter would have told me that."
That moment is the product.
