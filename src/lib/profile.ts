import type { Strictness, Tradition, UserProfile } from "@/types"

export type PracticeProfile = Pick<
  UserProfile,
  "tradition" | "subTradition" | "strictness" | "allergies" | "dislikes"
>

export const defaultProfile: PracticeProfile = {
  tradition: "satvik",
  subTradition: "Gaudiya Vaishnava",
  strictness: "strict",
  allergies: ["Nuts"],
  dislikes: []
}

export const strictnessLabels: Record<Strictness, string> = {
  standard: "Standard",
  strict: "Strict",
  festival: "Festival / Fast"
}

export const traditionSubTraditions: Record<Tradition, string[]> = {
  satvik: ["Gaudiya Vaishnava", "Ekadashi observer", "Strict no vinegar"],
  jain: ["Standard Jain", "Strict Jain", "Paryushana"],
  halal: ["Zabiha only", "Vegetarian when non-certified", "Seafood accepted"],
  kosher: ["Kosher-style", "Certified only", "Passover observant"],
  christian: ["Catholic Lent", "Orthodox strict fast", "Friday abstinence"],
  custom: ["Personal practice"]
}

export const normalizeProfile = (profile?: Partial<PracticeProfile> | null): PracticeProfile => ({
  tradition: profile?.tradition ?? defaultProfile.tradition,
  subTradition: profile?.subTradition ?? defaultProfile.subTradition,
  strictness: profile?.strictness ?? defaultProfile.strictness,
  allergies: profile?.allergies ?? defaultProfile.allergies,
  dislikes: profile?.dislikes ?? defaultProfile.dislikes
})
