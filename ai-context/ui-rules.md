# Bhojan — UI Rules and Design System

Every agent building UI must follow these rules exactly.
Do not improvise colors, fonts, or spacing.
Do not use any color, font, or pattern not listed here.

---

## AESTHETIC DIRECTION

Warm premium minimalism with spiritual depth.
Feels like: calm, trusted, deeply personal.
Feels like a premium wellness app, not a generic SaaS tool.
Think of the emotional tone of a well-designed meditation app combined with a trusted health product.

NOT: generic SaaS blue-and-white
NOT: cheap spiritual aesthetics (lotus emojis, gold gradients everywhere)
NOT: typical food app green-and-orange
NOT: cold, clinical, corporate

---

## COLOR SYSTEM

Use CSS variables. Define in globals.css.

```css
:root {
  --background: #FAFAF7;
  --surface: #FFFFFF;
  --surface-elevated: #F5F0E8;
  --accent-primary: #C17A2E;
  --accent-secondary: #4A6741;
  --status-safe: #2E7D5B;
  --status-safe-bg: #EDF7F2;
  --status-warning: #B8860B;
  --status-warning-bg: #FFF8E1;
  --status-violation: #C0392B;
  --status-violation-bg: #FDECEA;
  --status-uncertain: #888888;
  --status-uncertain-bg: #F5F5F5;
  --text-primary: #1A1A1A;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  --border: #E8E3DC;
  --border-strong: #C8C0B4;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.10);
}
```

---

## TYPOGRAPHY

Import in layout.tsx from Google Fonts:

```tsx
import { Playfair_Display, DM_Sans } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
})
```

Usage rules:
- All page headings (h1, h2): Playfair Display, font-display
- All body text, labels, buttons, descriptions: DM Sans, font-body
- Confidence percentages and scores: JetBrains Mono or system monospace
- Never use Inter, Roboto, Arial, or system-ui as primary font
- Never use system-ui for headings

Type scale:
- Display (page title): 28-32px, Playfair Display, font-weight 600
- Heading (section): 20-24px, Playfair Display, font-weight 500
- Body large: 16px, DM Sans, font-weight 400
- Body: 14px, DM Sans, font-weight 400
- Label: 12px, DM Sans, font-weight 500
- Caption: 11px, DM Sans, font-weight 400

---

## SPACING

Base unit: 8px
Use Tailwind spacing classes that follow 8px grid:
- 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px), 16 (64px)

Card padding: p-6 (24px)
Section gap: gap-10 (40px)
Component gap: gap-4 (16px)
Item gap inside component: gap-2 or gap-3

---

## BORDER RADIUS

- Cards: rounded-2xl (16px)
- Buttons (primary): rounded-full
- Buttons (secondary): rounded-xl
- Input fields: rounded-xl
- Badges/chips: rounded-full
- Images: rounded-xl
- Bottom sheet / modal: rounded-t-3xl (top corners only)

---

## COMPONENTS

### Cards
```tsx
<div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E3DC]">
```

### Primary Button
```tsx
<Button className="rounded-full bg-[#C17A2E] hover:bg-[#A66520] text-white font-medium px-6 py-3">
```

### Secondary Button
```tsx
<Button variant="outline" className="rounded-xl border-[#E8E3DC] text-[#1A1A1A]">
```

### Status Badge
```tsx
// SAFE
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#EDF7F2] text-[#2E7D5B]">
  SAFE
</span>

// WARNING
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FFF8E1] text-[#B8860B]">
  WARNING
</span>

// VIOLATION
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FDECEA] text-[#C0392B]">
  VIOLATION
</span>

// UNCERTAIN
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F5F5F5] text-[#888888]">
  UNCERTAIN
</span>
```

### Input Field
```tsx
<Input className="rounded-xl border-[#E8E3DC] bg-white focus:ring-[#C17A2E] focus:border-[#C17A2E]" />
```

### Observance Banner
```tsx
<div className="rounded-2xl p-4 bg-[#FFF8E1] border border-[#B8860B]/20">
  <p className="text-[#B8860B] font-medium text-sm">Ekadashi in 2 days</p>
  <p className="text-[#666] text-xs mt-1">Grains will be restricted. Tap to prepare.</p>
</div>
```

---

## ANIMATIONS

All animations use Framer Motion.
Never use CSS @keyframes for component animations.

### Page transition (wrap every page)
```tsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
```

### Staggered card list (scan results)
```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } }
}

<motion.div variants={container} initial="hidden" animate="show">
  {dishes.map(dish => (
    <motion.div key={dish.name} variants={item}>
      <DishCard dish={dish} />
    </motion.div>
  ))}
</motion.div>
```

### Scan pulsing animation
```tsx
<motion.div
  className="w-24 h-24 rounded-full border-4 border-[#C17A2E]"
  animate={{ scale: [1, 1.12, 1], opacity: [1, 0.6, 1] }}
  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
/>
```

### Status badge reveal
```tsx
<motion.span
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.15, delay: 0.1 }}
>
  {badge}
</motion.span>
```

---

## MOBILE RULES

All screens are designed mobile-first.
Base width: 390px (iPhone 14 Pro)

Layout rules:
- Max content width on mobile: 100% with px-4 horizontal padding
- On desktop: max-w-md mx-auto (centered column, not full width)
- Bottom navigation bar always visible on mobile
- No horizontal scroll anywhere
- All tap targets minimum 44px height
- Font sizes never below 12px

Bottom Navigation:
```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E3DC] flex items-center justify-around py-3 px-4">
  // 4 items: Home, Scan, Observance, Profile
</nav>
```

---

## LOADING STATES

Always show loading skeletons, not spinners, for content that takes time.

```tsx
// Skeleton card
<div className="rounded-2xl bg-[#F5F0E8] h-24 animate-pulse" />
```

Show skeleton immediately on navigation.
Never show blank white screen while loading.

---

## ICONOGRAPHY

Use Lucide React icons exclusively.
Icon size: 20px default, 16px for inline text, 24px for navigation.
Icon color: match the text color of the surrounding context.

Commonly used icons for Bhojan:
- ScanLine — menu scanner
- AlertCircle — violation warning
- CheckCircle2 — safe status
- HelpCircle — uncertain status
- AlertTriangle — warning status
- Calendar — observance
- ShoppingBag — marketplace
- User — profile
- Home — dashboard
- ChevronDown — expandable section
- X — close / remove
- Leaf — brand icon (use as logo accent)

---

## WHAT NEVER TO DO

- No purple anywhere
- No full blue color schemes
- No Comic Sans, Roboto, Arial, Inter, or system-ui as primary fonts
- No harsh box shadows (use var(--shadow-sm) max for cards)
- No full-width primary buttons unless it is the single CTA on a screen
- No text smaller than 11px
- No touch target smaller than 44px height
- No horizontal scroll
- No CSS gradient backgrounds on content areas (only subtle on hero/splash)
- No emoji in UI (except culturally appropriate in marketing copy)
- No placeholder text as labels (always use proper label elements)
