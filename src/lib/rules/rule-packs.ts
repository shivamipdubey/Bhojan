import type { ComplianceStatus, Strictness, Tradition } from "@/types"

export type RuleMatch = {
  terms: string[]
  reason: string
  hiddenRisk?: string
  askKitchen?: string[]
  confidence: number
  status?: Exclude<ComplianceStatus, "safe">
  strictness?: Strictness[]
}

export const rulePacks: Record<Tradition, RuleMatch[]> = {
  satvik: [
    {
      terms: ["garlic", "garlic powder", "aioli"],
      reason: "Garlic is avoided in satvik practice in all forms.",
      hiddenRisk: "Garlic powder is common in sauces, seasoning blends, and marinades.",
      askKitchen: ["Does this contain garlic, garlic powder, garlic paste, or garlic-infused oil?"],
      confidence: 0.94
    },
    {
      terms: ["onion", "shallot", "scallion", "chive", "leek"],
      reason: "Onion and related alliums are avoided in satvik devotional practice.",
      hiddenRisk: "Onion powder is common in stocks, gravies, and spice bases.",
      askKitchen: ["Does the sauce, stock, seasoning, or garnish contain onion or any allium?"],
      confidence: 0.92
    },
    {
      terms: ["mushroom", "truffle", "fungi"],
      reason: "Mushrooms and fungi are avoided in strict satvik practice.",
      hiddenRisk: "Mushroom stock is common in risotto, soups, and gravies.",
      askKitchen: ["Is there mushroom, truffle, mushroom stock, or mushroom powder in the base?"],
      confidence: 0.94
    },
    {
      terms: ["wine", "beer", "liqueur", "rum", "marsala", "alcohol"],
      reason: "Alcohol is not compliant with satvik practice.",
      hiddenRisk: "Wine is often used for deglazing and may not be listed in the menu text.",
      askKitchen: ["Is wine, beer, liqueur, Marsala, rum, or any alcohol used during cooking?"],
      confidence: 0.95
    },
    {
      terms: ["egg", "eggs", "mayonnaise", "fresh pasta"],
      reason: "Eggs are avoided in satvik practice.",
      hiddenRisk: "Fresh pasta, dressings, breads, and desserts often contain eggs.",
      askKitchen: ["Is there egg in the pasta, dressing, bread, batter, or dessert base?"],
      confidence: 0.9
    },
    {
      terms: ["vinegar", "balsamic", "apple cider vinegar", "malt vinegar"],
      reason: "Vinegar is avoided by many strict satvik observers.",
      hiddenRisk: "Vinegar can be hidden in dressings, sauces, pickles, and condiments.",
      askKitchen: ["Does this include vinegar, balsamic reduction, pickles, or vinegar-based dressing?"],
      confidence: 0.8,
      status: "warning",
      strictness: ["strict", "festival"]
    }
  ],
  jain: [
    {
      terms: ["garlic", "onion", "shallot", "scallion", "chive", "leek"],
      reason: "Onion, garlic, and alliums are avoided in Jain practice.",
      hiddenRisk: "Ginger-garlic paste and onion bases are common in restaurant sauces.",
      askKitchen: ["Is the gravy or seasoning made with onion, garlic, or ginger-garlic paste?"],
      confidence: 0.94
    },
    {
      terms: ["potato", "carrot", "beet", "radish", "ginger", "turmeric", "yam", "sweet potato", "turnip"],
      reason: "Root vegetables are avoided in Jain practice.",
      hiddenRisk: "Potato and ginger are often used as thickeners or gravy bases.",
      askKitchen: ["Does this contain potato, carrot, beet, radish, ginger, turmeric, yam, or other root vegetables?"],
      confidence: 0.9
    },
    {
      terms: ["mushroom", "truffle", "fungi"],
      reason: "Mushrooms and fungi are avoided in Jain practice.",
      hiddenRisk: "Truffle oil and mushroom stock can appear in upscale vegetarian dishes.",
      askKitchen: ["Is there mushroom, truffle, fungi, or mushroom stock in the preparation?"],
      confidence: 0.94
    },
    {
      terms: ["honey"],
      reason: "Honey is avoided in Jain practice.",
      hiddenRisk: "Honey can appear in dressings, marinades, and desserts.",
      confidence: 0.9
    },
    {
      terms: ["wine", "beer", "vinegar", "soy sauce", "miso", "tempeh", "fermented"],
      reason: "Alcohol and fermented foods are avoided in strict Jain practice.",
      hiddenRisk: "Fermented sauces are common in Asian and fusion restaurants.",
      askKitchen: ["Does this include vinegar, soy sauce, miso, tempeh, alcohol, or fermented sauces?"],
      confidence: 0.86
    },
    {
      terms: ["eggplant", "brinjal"],
      reason: "Eggplant is avoided by some strict Jain observers.",
      confidence: 0.72,
      status: "warning",
      strictness: ["strict", "festival"]
    }
  ],
  halal: [
    {
      terms: ["pork", "bacon", "ham", "lard", "prosciutto", "pepperoni"],
      reason: "Pork and pork derivatives are prohibited in halal practice.",
      hiddenRisk: "Lard can appear in pastries, beans, pie crusts, and breads.",
      askKitchen: ["Is there pork, bacon, ham, lard, pork stock, or pork gelatin in this item?"],
      confidence: 0.98
    },
    {
      terms: ["wine", "beer", "liqueur", "rum", "marsala", "alcohol", "shaoxing"],
      reason: "Alcohol is not compliant with halal practice.",
      hiddenRisk: "Wine or beer may be cooked into sauces, glazes, batters, and desserts.",
      askKitchen: ["Is wine, beer, mirin, Shaoxing wine, rum, or alcohol-based extract used?"],
      confidence: 0.95
    },
    {
      terms: ["gelatin", "marshmallow", "gummy", "panna cotta"],
      reason: "Gelatin may be pork-derived unless halal or vegetarian sourcing is confirmed.",
      hiddenRisk: "Desserts may use gelatin even when the menu does not list it.",
      askKitchen: ["If gelatin is used, is it halal-certified, fish-derived, or plant-based?"],
      confidence: 0.74,
      status: "warning"
    },
    {
      terms: ["beef", "chicken", "duck", "lamb", "meat"],
      reason: "Meat must be halal-certified for strict zabiha practice.",
      hiddenRisk: "Restaurants may use non-halal meat even when the meat type itself is permitted.",
      askKitchen: ["Is this meat halal-certified or zabiha, and is it cooked separately from non-halal meat?"],
      confidence: 0.7,
      status: "warning",
      strictness: ["strict", "festival"]
    }
  ],
  kosher: [
    {
      terms: ["pork", "bacon", "ham", "lard", "prosciutto", "pepperoni"],
      reason: "Pork and pork derivatives are not kosher.",
      hiddenRisk: "Lard can appear in pastries, beans, pie crusts, and breads.",
      askKitchen: ["Is there pork, bacon, ham, lard, pork stock, or gelatin in this item?"],
      confidence: 0.98
    },
    {
      terms: ["shellfish", "shrimp", "prawn", "lobster", "crab", "clam", "oyster", "mussel"],
      reason: "Shellfish is not kosher.",
      askKitchen: ["Is there shellfish, shellfish stock, oyster sauce, or shared fryer contact?"],
      confidence: 0.96
    },
    {
      terms: ["cheeseburger", "cream sauce with beef", "meat and dairy", "parmesan chicken"],
      reason: "Kosher practice does not mix meat and dairy in the same meal.",
      hiddenRisk: "Restaurants may cook meat and dairy together or share utensils.",
      askKitchen: ["Is this meat, dairy, or pareve, and are separate utensils used?"],
      confidence: 0.88
    },
    {
      terms: ["wine", "grape juice", "grape vinegar"],
      reason: "Grape products require kosher supervision for observant kosher practice.",
      askKitchen: ["Is the wine, grape juice, or grape vinegar kosher-certified?"],
      confidence: 0.78,
      status: "warning",
      strictness: ["strict", "festival"]
    }
  ],
  christian: [
    {
      terms: ["beef", "chicken", "pork", "lamb", "bacon", "ham", "meat"],
      reason: "Meat is restricted on many Christian fasting or abstinence days.",
      askKitchen: ["Does this contain meat, meat stock, bacon, poultry, beef, lamb, or pork?"],
      confidence: 0.86,
      status: "warning",
      strictness: ["festival", "strict"]
    },
    {
      terms: ["cream", "cheese", "butter", "milk", "egg"],
      reason: "Dairy and eggs are restricted on strict Orthodox Christian fasting days.",
      askKitchen: ["Does this include dairy, egg, butter, cream, cheese, or milk?"],
      confidence: 0.74,
      status: "warning",
      strictness: ["strict"]
    },
    {
      terms: ["wine", "olive oil"],
      reason: "Wine and oil may be restricted on strict Orthodox fast days.",
      askKitchen: ["Does this contain wine or oil, and can it be prepared without them?"],
      confidence: 0.68,
      status: "warning",
      strictness: ["strict"]
    }
  ],
  custom: []
}

export const observanceRules: Record<string, RuleMatch[]> = {
  ekadashi: [
    {
      terms: ["rice", "wheat", "pasta", "bread", "flour", "corn", "barley", "oats", "lentil", "dal", "chickpea", "bean"],
      reason: "Ekadashi restricts grains, beans, and lentils for many Vaishnava observers.",
      hiddenRisk: "Flour, semolina, and starches can be hidden in batters, breads, and pasta.",
      askKitchen: ["Does this contain wheat, rice, corn, oats, flour, dal, beans, peas, chickpeas, or lentils?"],
      confidence: 0.88,
      status: "warning"
    }
  ],
  paryushana: [
    {
      terms: ["spinach", "lettuce", "kale", "cilantro", "leafy", "outside food"],
      reason: "Paryushana can add stricter Jain limits, including avoiding leafy vegetables and restaurant food.",
      askKitchen: ["Does this contain leafy vegetables, and can every ingredient be confirmed for Paryushana-level practice?"],
      confidence: 0.76,
      status: "warning"
    }
  ],
  passover: [
    {
      terms: ["bread", "pasta", "wheat", "barley", "oats", "rye", "spelt", "leavened", "beer"],
      reason: "Passover restricts chametz and requires Passover-specific supervision for many foods.",
      askKitchen: ["Is this certified kosher for Passover and free from chametz ingredients or contact?"],
      confidence: 0.86,
      status: "warning"
    }
  ],
  ramadan: [],
  "good friday": [
    {
      terms: ["beef", "chicken", "pork", "lamb", "bacon", "ham", "meat"],
      reason: "Good Friday abstinence commonly restricts meat.",
      askKitchen: ["Can this be prepared without meat or meat stock?"],
      confidence: 0.9,
      status: "warning"
    }
  ]
}
