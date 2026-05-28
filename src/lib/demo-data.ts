import type { DemoPersona, MarketplaceItem, Observance, ScanResult, Tradition } from "@/types"
import demoScan from "../../public/demo/sample_scan_result.json"

export const sampleScanResult = demoScan as ScanResult

export const demoPersonas: DemoPersona[] = [
  {
    id: "shivam-satvik",
    name: "Shivam",
    description: "Gaudiya Vaishnava, strict satvik, nut allergy",
    profile: {
      tradition: "satvik",
      subTradition: "Gaudiya Vaishnava",
      strictness: "strict",
      allergies: ["Nuts"],
      dislikes: []
    }
  },
  {
    id: "aisha-halal",
    name: "Aisha",
    description: "Halal, zabiha meat only",
    profile: {
      tradition: "halal",
      subTradition: "Zabiha only",
      strictness: "strict",
      allergies: [],
      dislikes: []
    }
  },
  {
    id: "rhea-jain",
    name: "Rhea",
    description: "Strict Jain, avoids roots and fermented foods",
    profile: {
      tradition: "jain",
      subTradition: "Strict Jain",
      strictness: "strict",
      allergies: [],
      dislikes: ["eggplant"]
    }
  }
]

export const demoObservances: Observance[] = [
  {
    id: "ekadashi-demo",
    tradition: "satvik",
    name: "Ekadashi",
    description: "Grains, beans, and lentils are restricted for many Vaishnava observers.",
    startDate: "2026-05-27",
    endDate: null,
    dietaryChanges: ["Avoid grains", "Avoid beans and lentils", "Use sendha namak"],
    ritualItems: ["Sabudana", "Sendha namak", "Dry fruits", "Kuttu ka atta"],
    isRecurring: true,
    nextOccurrence: "2026-05-27"
  },
  {
    id: "paryushana-demo",
    tradition: "jain",
    name: "Paryushana",
    description: "A period of stricter Jain observance with careful limits on vegetables and outside food.",
    startDate: "2026-08-18",
    endDate: "2026-08-26",
    dietaryChanges: ["Avoid green leafy vegetables", "Prefer home-prepared food"],
    ritualItems: ["Dry fruits", "Stored grains", "Jain-friendly snacks"],
    isRecurring: true,
    nextOccurrence: "2026-08-18"
  },
  {
    id: "ramadan-demo",
    tradition: "halal",
    name: "Ramadan",
    description: "Daily fasting from Fajr to Maghrib, with halal rules still applying during eating windows.",
    startDate: "2027-02-08",
    endDate: "2027-03-09",
    dietaryChanges: ["Fast from dawn to sunset", "Break fast with halal foods"],
    ritualItems: ["Dates", "Rooh Afza", "Halal soup mix"],
    isRecurring: true,
    nextOccurrence: "2027-02-08"
  },
  {
    id: "passover-demo",
    tradition: "kosher",
    name: "Passover",
    description: "Chametz is restricted, and many observers use separate certified Passover foods.",
    startDate: "2027-04-21",
    endDate: "2027-04-29",
    dietaryChanges: ["Avoid chametz", "Use kosher-for-Passover products"],
    ritualItems: ["Matzah", "Kosher grape juice", "Passover pantry kit"],
    isRecurring: true,
    nextOccurrence: "2027-04-21"
  },
  {
    id: "good-friday-demo",
    tradition: "christian",
    name: "Good Friday",
    description: "Many Catholic and Christian observers abstain from meat and eat simply.",
    startDate: "2027-03-26",
    endDate: null,
    dietaryChanges: ["No meat", "Simple meals"],
    ritualItems: ["Simple pantry kit", "Fish-friendly meal kit"],
    isRecurring: true,
    nextOccurrence: "2027-03-26"
  }
]

export const marketplaceItems: MarketplaceItem[] = [
  {
    id: "sabudana",
    name: "Sabudana",
    category: "Vrat Essentials",
    traditions: ["satvik"],
    price: 2.99,
    imageUrl: null,
    description: "Tapioca pearls for Ekadashi-friendly khichdi and kheer.",
    observanceTags: ["Ekadashi"]
  },
  {
    id: "sendha-namak",
    name: "Sendha Namak",
    category: "Vrat Essentials",
    traditions: ["satvik", "jain"],
    price: 1.99,
    imageUrl: null,
    description: "Rock salt used during many Hindu fasting days.",
    observanceTags: ["Ekadashi"]
  },
  {
    id: "dry-fruits",
    name: "Assorted Dry Fruits",
    category: "Fasting Pantry",
    traditions: ["satvik", "jain", "halal", "kosher"],
    price: 5.99,
    imageUrl: null,
    description: "A compact energy kit for observance days.",
    observanceTags: ["Ekadashi", "Paryushana", "Ramadan"]
  },
  {
    id: "kuttu-atta",
    name: "Kuttu Ka Atta",
    category: "Vrat Essentials",
    traditions: ["satvik"],
    price: 2.49,
    imageUrl: null,
    description: "Buckwheat flour for fasting rotis and pancakes.",
    observanceTags: ["Ekadashi"]
  },
  {
    id: "premium-dates",
    name: "Premium Dates",
    category: "Ramadan Pantry",
    traditions: ["halal"],
    price: 6.99,
    imageUrl: null,
    description: "Soft dates for iftar and suhoor preparation.",
    observanceTags: ["Ramadan"]
  },
  {
    id: "matzah",
    name: "Matzah Box",
    category: "Passover Pantry",
    traditions: ["kosher"],
    price: 4.99,
    imageUrl: null,
    description: "A starter matzah pack for Passover meals.",
    observanceTags: ["Passover"]
  }
]

export const getObservancesForTradition = (tradition: Tradition) =>
  demoObservances.filter((item) => item.tradition === tradition)

export const getMarketplaceItemsForTradition = (tradition: Tradition, observanceName?: string | null) =>
  marketplaceItems.filter((item) => {
    const traditionMatch = item.traditions.includes(tradition)
    const observanceMatch = observanceName ? item.observanceTags.includes(observanceName) : true
    return traditionMatch && observanceMatch
  })

export const getDemoScanForTradition = (tradition: Tradition): ScanResult => {
  if (tradition === "halal") {
    return {
      restaurant: "Golden Dragon",
      scanId: "demo-golden-dragon",
      dishes: [
        {
          name: "Pork Fried Rice",
          status: "violation",
          confidence: 0.99,
          violations: ["pork"],
          violationReason: "Pork is explicitly listed and is prohibited in halal practice.",
          hiddenRisk: "Fried rice may also use lard or non-halal meat stock.",
          alternatives: ["Steamed vegetables", "Vegetable fried rice cooked in a clean wok"],
          observanceNote: null
        },
        {
          name: "Peking Duck with Hoisin",
          status: "warning",
          confidence: 0.72,
          violations: ["non-zabiha meat"],
          violationReason: "Duck must be halal-certified for strict zabiha practice.",
          hiddenRisk: "Some glazes use Shaoxing wine or other alcohol-based sauces.",
          alternatives: ["Steamed vegetables", "Tofu with plain ginger sauce"],
          observanceNote: null
        },
        {
          name: "Steamed Vegetables",
          status: "safe",
          confidence: 0.86,
          violations: [],
          violationReason: null,
          hiddenRisk: "Confirm no wine-based sauce or pork stock is added after steaming.",
          alternatives: [],
          observanceNote: null
        },
        {
          name: "Mango Pudding",
          status: "warning",
          confidence: 0.74,
          violations: ["possible gelatin"],
          violationReason: "Gelatin may be pork-derived unless the kitchen confirms a halal or vegetarian setting agent.",
          hiddenRisk: "Asian puddings may use gelatin even when not listed.",
          alternatives: ["Fresh mango", "Ask whether agar-agar is used"],
          observanceNote: null
        }
      ],
      overallSafety: "caution",
      observanceAlert: null,
      safeCount: 1,
      warningCount: 2,
      violationCount: 1,
      uncertainCount: 0,
      isDemoMode: true
    }
  }

  if (tradition === "jain") {
    return {
      ...sampleScanResult,
      scanId: "demo-jain-bella-italia",
      dishes: sampleScanResult.dishes.map((dish) =>
        dish.name === "Penne Pomodoro"
          ? {
              ...dish,
              status: "warning",
              confidence: 0.78,
              violations: ["possible garlic", "possible onion"],
              violationReason: "Tomato sauces commonly use onion or garlic as a base, which violates Jain practice.",
              observanceNote: "During Paryushana, eating outside the home may be avoided by strict observers."
            }
          : dish
      ),
      overallSafety: "avoid",
      safeCount: 0,
      warningCount: 2,
      violationCount: 4,
      uncertainCount: 1,
      isDemoMode: true
    }
  }

  return sampleScanResult
}
