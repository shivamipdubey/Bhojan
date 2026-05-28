import { observanceRules, rulePacks, type RuleMatch } from "@/lib/rules/rule-packs"
import { scanResultSchema } from "@/lib/schemas"
import type { ComplianceStatus, DishCompliance, ScanResult, UserProfile } from "@/types"

type ScanProfile = Pick<UserProfile, "tradition" | "allergies" | "dislikes"> &
  Partial<Pick<UserProfile, "strictness" | "subTradition">> & {
    activeObservances?: string[]
  }

const dishNameAndViolations = (dish: DishCompliance) =>
  [dish.name, dish.violations.join(" ")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

const fullText = (dish: DishCompliance) =>
  [dish.name, dish.violationReason, dish.violations.join(" ")]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

const rankStatus = (status: ComplianceStatus) =>
  ({ safe: 0, uncertain: 1, warning: 2, violation: 3 })[status]

const strongerStatus = (current: ComplianceStatus, next: ComplianceStatus) =>
  rankStatus(next) > rankStatus(current) ? next : current

const appliesToStrictness = (rule: RuleMatch, profile: ScanProfile) =>
  !rule.strictness?.length || rule.strictness.includes(profile.strictness ?? "standard")

const wordBoundary = (term: string) =>
  new RegExp(`(^|\\s)${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`, "i")

const matchedTerms = (rule: RuleMatch, text: string) =>
  rule.terms.filter((term) => wordBoundary(term).test(text))

const activeRulesForProfile = (profile: ScanProfile) => {
  const baseRules = rulePacks[profile.tradition].filter((rule) => appliesToStrictness(rule, profile))
  const observanceRulesForProfile = (profile.activeObservances ?? []).flatMap((observance) => {
    const key = observance.toLowerCase()
    return Object.entries(observanceRules)
      .filter(([name]) => key.includes(name))
      .flatMap(([, rules]) => rules)
  })

  return [...baseRules, ...observanceRulesForProfile]
}

export const validateScanResult = (raw: unknown, profile: ScanProfile): ScanResult => {
  const parsed = scanResultSchema.parse(raw)
  const rules = activeRulesForProfile(profile)

  const dishes = parsed.dishes.map((dish) => {
    const matchText = dishNameAndViolations(dish)
    const full = fullText(dish)
    const violations = new Set(dish.violations ?? [])
    let status = dish.status
    let confidence = Number.isFinite(dish.confidence) ? dish.confidence : 0.4
    let violationReason = dish.violationReason
    let hiddenRisk = dish.hiddenRisk
    let observanceNote = dish.observanceNote
    const askKitchen = new Set(dish.askKitchen ?? [])

    for (const rule of rules) {
      const terms = matchedTerms(rule, matchText)
      if (!terms.length) continue

      terms.forEach((term) => violations.add(term))
      const hasUncertaintyLanguage = /cannot confirm|possible|likely|may contain|may use|ask|confirm/.test(full)
      const inferredStatus = hasUncertaintyLanguage ? "warning" : rule.status ?? (rule.confidence >= 0.85 ? "violation" : "warning")
      status = strongerStatus(status, inferredStatus)
      confidence = Math.max(confidence, rule.confidence)
      violationReason ||= rule.reason
      hiddenRisk ||= rule.hiddenRisk ?? null
      rule.askKitchen?.forEach((question) => askKitchen.add(question))

      if ((profile.activeObservances ?? []).length && Object.values(observanceRules).some((items) => items.includes(rule))) {
        observanceNote ||= rule.reason
      }
    }

    for (const allergy of profile.allergies ?? []) {
      if (allergy && matchText.includes(allergy.toLowerCase())) {
        violations.add(allergy)
        status = "violation"
        confidence = Math.max(confidence, 0.97)
        violationReason ||= `${allergy} conflicts with your saved allergy profile.`
      }
    }

    for (const dislike of profile.dislikes ?? []) {
      if (dislike && matchText.includes(dislike.toLowerCase())) {
        hiddenRisk ||= `${dislike} appears in or near this item and is in your personal avoid list.`
        askKitchen.add(`Can this be prepared without ${dislike}?`)
        status = strongerStatus(status, "warning")
      }
    }

    return {
      ...dish,
      status,
      confidence: Math.min(0.99, Math.max(0.2, confidence)),
      violations: Array.from(violations),
      violationReason,
      hiddenRisk,
      observanceNote,
      askKitchen: Array.from(askKitchen).slice(0, 4)
    }
  })

  const safeCount = dishes.filter((dish) => dish.status === "safe").length
  const warningCount = dishes.filter((dish) => dish.status === "warning").length
  const violationCount = dishes.filter((dish) => dish.status === "violation").length
  const uncertainCount = dishes.filter((dish) => dish.status === "uncertain").length
  const overallSafety = violationCount > 2 ? "avoid" : violationCount || warningCount || uncertainCount ? "caution" : "safe"

  return {
    restaurant: parsed.restaurant ?? null,
    scanId: parsed.scanId ?? crypto.randomUUID(),
    dishes,
    overallSafety,
    observanceAlert: parsed.observanceAlert ?? null,
    safeCount,
    warningCount,
    violationCount,
    uncertainCount,
    isDemoMode: parsed.isDemoMode,
    createdAt: parsed.createdAt
  }
}
