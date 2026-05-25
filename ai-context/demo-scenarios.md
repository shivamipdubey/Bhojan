# Bhojan — Demo Scenarios

---

## PRIMARY DEMO (Use This One For Everything)

User persona: Shivam, Gaudiya Vaishnava, satvik practice, nut allergy
Restaurant: "Bella Italia" — Italian restaurant
Upcoming observance: Ekadashi in 2 days

### Expected Scan Output
Load this from /public/demo/sample_scan_result.json

```json
{
  "restaurant": "Bella Italia",
  "dishes": [
    {
      "name": "Margherita Pizza",
      "status": "warning",
      "confidence": 0.87,
      "violations": ["garlic"],
      "violationReason": "Italian pizza base sauces typically contain garlic. Cannot confirm without asking kitchen.",
      "hiddenRisk": "Garlic powder is common in Italian herb seasoning blends used on the crust.",
      "alternatives": ["Request base sauce without garlic", "Ask for plain tomato with just basil"],
      "observanceNote": null
    },
    {
      "name": "Mushroom Risotto",
      "status": "violation",
      "confidence": 0.94,
      "violations": ["mushrooms", "white wine"],
      "violationReason": "Contains mushrooms which violate satvik and Jain practice. Risotto stock almost always contains white wine.",
      "hiddenRisk": "White wine is a standard ingredient in risotto preparation even when not stated on menu.",
      "alternatives": ["Penne Pomodoro", "Grilled vegetable plate — ask to confirm no garlic"],
      "observanceNote": null
    },
    {
      "name": "Penne Pomodoro",
      "status": "safe",
      "confidence": 0.82,
      "violations": [],
      "violationReason": null,
      "hiddenRisk": "Confirm with kitchen that tomato sauce does not contain garlic. Some Italian restaurants add garlic as standard.",
      "alternatives": [],
      "observanceNote": "Safe today. On Ekadashi (2 days), pasta will be restricted as it contains wheat."
    },
    {
      "name": "Caesar Salad",
      "status": "violation",
      "confidence": 0.96,
      "violations": ["Worcestershire sauce", "anchovy"],
      "violationReason": "Classic Caesar dressing contains Worcestershire sauce which is made with anchovies. Also commonly contains egg in the dressing.",
      "hiddenRisk": "Even 'vegetarian Caesar' often retains the Worcestershire flavor base. Always confirm.",
      "alternatives": ["Garden salad with olive oil and lemon", "Ask for plain greens with no dressing"],
      "observanceNote": null
    },
    {
      "name": "Garlic Bread",
      "status": "violation",
      "confidence": 0.99,
      "violations": ["garlic", "possible egg in bread"],
      "violationReason": "Garlic is the primary ingredient. Garlic powder also present in the butter mix.",
      "hiddenRisk": "Some focaccia-style garlic breads use egg wash on the crust.",
      "alternatives": ["Plain bread or grissini — confirm no garlic butter"],
      "observanceNote": null
    },
    {
      "name": "Tiramisu",
      "status": "violation",
      "confidence": 0.98,
      "violations": ["coffee liqueur (alcohol)", "eggs", "possible gelatin"],
      "violationReason": "Traditional tiramisu contains Kahlua or Marsala wine (alcohol), egg yolks in the mascarpone mix.",
      "hiddenRisk": "Some restaurant versions use gelatin as a stabilizer.",
      "alternatives": ["Fresh fruit plate", "Panna cotta — but confirm gelatin source is vegetarian"],
      "observanceNote": null
    },
    {
      "name": "Panna Cotta",
      "status": "uncertain",
      "confidence": 0.38,
      "violations": [],
      "violationReason": null,
      "hiddenRisk": "Panna cotta is set with gelatin. Cannot determine if vegetarian/agar-based without asking kitchen directly.",
      "alternatives": ["Ask kitchen: is the panna cotta set with gelatin or agar-agar?"],
      "observanceNote": null
    }
  ],
  "overallSafety": "caution",
  "observanceAlert": "Ekadashi is in 2 days. On that day, Penne Pomodoro and all pasta will be restricted as they contain wheat. Plan ahead.",
  "safeCount": 1,
  "warningCount": 1,
  "violationCount": 4,
  "uncertainCount": 1
}
```

### Emotional Moments In This Demo
1. Mushroom Risotto violation — "It caught the hidden wine. No waiter would have said that."
2. Caesar Salad violation — "Worcestershire has anchovy. Most people don't know that."
3. Garlic Bread confidence 0.99 — "99% confident. Because garlic is literally in the name."
4. Panna Cotta as UNCERTAIN — "It admits when it doesn't know. That's what makes it trustworthy."
5. Ekadashi observance note on Penne — "It knows my fasting calendar and tells me ahead of time."

---

## SECONDARY DEMO (For Q&A If Judges Ask)

User: Aisha, Halal practice
Restaurant: "Golden Dragon" — Chinese/Asian fusion

Key violations to show:
- Pork fried rice — violation (pork)
- Peking duck with hoisin — warning (may contain alcohol in glaze)
- Tom yum soup — uncertain (fish sauce compliance unclear for user's school of thought)
- Steamed vegetables — safe
- Spring rolls — warning (may contain pork in filling)

---

## KIT SUGGESTION AFTER DEMO

After the Italian menu scan, the observance banner appears:
"Ekadashi in 2 days"

Below the results, the KitSuggestion component shows:

Heading: "Prepare for Ekadashi"
Products:
- Sabudana (tapioca pearls) — ₹85 / $2.99
- Sendha Namak (rock salt) — ₹60 / $1.99
- Assorted dry fruits mix — ₹320 / $5.99
- Kuttu ka atta (buckwheat flour) — ₹140 / $2.49

CTA: "Order Vrat Essentials Kit"

---

# Bhojan — Feature Priority

This is the definitive priority list for the hackathon.
When in doubt about what to build next, refer to this list.
Build in order. Never build a lower priority item before completing higher priority items.

---

## TIER 1 — MUST HAVE (Cannot demo without these)

1. Auth (signup + login + session persistence)
2. Onboarding 3-step flow (tradition + allergies + dislikes)
3. Profile saved to Supabase
4. Menu upload component with scanning animation
5. OpenAI Vision API call returning compliance JSON
6. ComplianceDishCard rendering status, confidence, violations, alternatives
7. Dashboard with observance banner
8. Demo mode (?demo=true loads sample_scan_result.json)

---

## TIER 2 — SHOULD HAVE (Makes demo compelling)

9. Staggered card reveal animation on scan results
10. Filter chips on results (All/Safe/Warning/Violation/Uncertain)
11. Summary bar on results (X safe, X violations, etc.)
12. KitSuggestion component at bottom of results
13. Loading skeletons everywhere
14. Mobile bottom navigation
15. Scan saved to Supabase history
16. Recent scans on dashboard

---

## TIER 3 — NICE TO HAVE (Only if Tier 1 + 2 are done)

17. Observance page with calendar view
18. Collapsible alternatives section on dish card
19. Observance detail page
20. Full marketplace page with product grid
21. Profile edit page
22. Scan history page

---

## NEVER BUILD (Not worth time for hackathon)

- Real payment processing
- Order fulfillment / delivery tracking
- Push notifications
- Barcode scanning
- Camera live overlay
- Multiple language support
- Social sharing
- User reviews
- Recipe suggestions
- Full admin panel
