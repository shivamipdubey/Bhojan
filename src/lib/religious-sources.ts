import type { Tradition } from "@/types"

export type SourceBackedGuide = {
  tradition: Tradition
  title: string
  checks: string[]
  kitchenQuestions: string[]
  sourceLabel: string
  sourceUrl: string
}

export const sourceBackedGuides: SourceBackedGuide[] = [
  {
    tradition: "satvik",
    title: "Ekadashi and Satvik Hidden Ingredients",
    checks: [
      "Ekadashi adds restrictions on grains, beans, peas, dahl, and derivatives such as wheat flour.",
      "Restaurant sauces often need direct confirmation for onion, garlic, wine, vinegar, egg, and mushroom stock."
    ],
    kitchenQuestions: [
      "Does this sauce or seasoning contain onion or garlic in any form?",
      "Is there wine, vinegar, mushroom stock, or egg in the base?",
      "If today is Ekadashi, does this contain wheat, rice, dal, beans, peas, corn, or flour?"
    ],
    sourceLabel: "ISKCON Desire Tree: Ekadasi observance",
    sourceUrl: "https://iskcondesiretree.com/page/ekadasi-observance"
  },
  {
    tradition: "jain",
    title: "Jain Root, Fungi, and Fermentation Checks",
    checks: [
      "Traditional Jain diet excludes root vegetables including onion, garlic, potato, and carrot.",
      "Paryushana can add stricter practice, including avoiding leafy vegetables and restaurant food for strict observers."
    ],
    kitchenQuestions: [
      "Does this contain onion, garlic, ginger, potato, carrot, beet, radish, or other root vegetables?",
      "Is the gravy based on ginger-garlic paste or onion?",
      "Does this include mushrooms, truffle, vinegar, soy sauce, or other fermented ingredients?"
    ],
    sourceLabel: "Arihanta Institute: Jain root vegetable guidance",
    sourceUrl: "https://www.arihantainstitute.org/blog/12-why-don-t-jains-eat-root-vegetables"
  },
  {
    tradition: "halal",
    title: "Halal Certification, Alcohol, and Gelatin",
    checks: [
      "Halal guidance commonly flags pork, alcohol, and non-halal animal-derived ingredients.",
      "Gelatin should be verified as halal-certified, fish-derived, or plant-based."
    ],
    kitchenQuestions: [
      "Is the meat halal-certified, and is it cooked separately from non-halal meat?",
      "Is there wine, beer, mirin, Shaoxing wine, rum, vanilla extract with alcohol, or alcohol-based glaze?",
      "If this dessert contains gelatin, is it halal-certified, fish-derived, or plant-based?"
    ],
    sourceLabel: "USDA FNS: Halal foods guidance",
    sourceUrl: "https://www.fns.usda.gov/tefap/halal"
  },
  {
    tradition: "kosher",
    title: "Kosher Separation and Passover Checks",
    checks: [
      "Kosher practice prohibits pork and shellfish and separates meat and dairy.",
      "Passover adds chametz restrictions, and Ashkenazi custom may also avoid kitniyot."
    ],
    kitchenQuestions: [
      "Is this item certified kosher, and is it meat, dairy, or pareve?",
      "Is it prepared with separate utensils from non-kosher meat, shellfish, or meat-dairy combinations?",
      "For Passover, is it certified kosher for Passover and free from chametz?"
    ],
    sourceLabel: "Chabad: What is Kosher?",
    sourceUrl: "https://www.chabad.org/library/article_cdo/aid/113425/jewish/What-Is-Kosher.htm"
  },
  {
    tradition: "christian",
    title: "Christian Fasting Practice Checks",
    checks: [
      "Many Christian fasting traditions restrict meat on specific days.",
      "Strict Orthodox fast days may restrict dairy, eggs, oil, and wine."
    ],
    kitchenQuestions: [
      "Does this contain meat stock, bacon, poultry, beef, lamb, or pork?",
      "For strict fast days, does it contain dairy, egg, oil, or wine?",
      "Can this be prepared simply with vegetables, grains, and legumes?"
    ],
    sourceLabel: "Bhojan internal Christian fasting rules",
    sourceUrl: "/guide"
  },
  {
    tradition: "custom",
    title: "Custom Practice Checks",
    checks: [
      "Custom profiles rely on allergies, dislikes, and user-defined avoids.",
      "Bhojan should be conservative when menu details are vague."
    ],
    kitchenQuestions: [
      "Can you confirm every ingredient in the sauce, stock, seasoning, and garnish?",
      "Are any ingredients hidden in the preparation rather than listed on the menu?"
    ],
    sourceLabel: "Bhojan custom practice rules",
    sourceUrl: "/guide"
  }
]

export const getGuideForTradition = (tradition: Tradition) =>
  sourceBackedGuides.find((guide) => guide.tradition === tradition) ?? sourceBackedGuides[sourceBackedGuides.length - 1]
