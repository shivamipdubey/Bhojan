import { z } from "zod"

export const traditionSchema = z.enum(["satvik", "jain", "halal", "kosher", "christian", "custom"])
export const strictnessSchema = z.enum(["standard", "strict", "festival"]).default("standard")
export const complianceStatusSchema = z.preprocess(
  (val) => {
    if (typeof val !== "string") return "uncertain";
    const s = val.toLowerCase().trim();
    if (s.includes("safe") || s === "compliant" || s === "ok" || s === "green") return "safe";
    if (s.includes("warn") || s === "caution" || s === "yellow") return "warning";
    if (s.includes("violat") || s === "avoid" || s === "unsafe" || s === "non-compliant" || s === "forbidden" || s === "red") return "violation";
    if (s.includes("uncertain") || s === "ask" || s === "unknown") return "uncertain";
    return "uncertain";
  },
  z.enum(["safe", "warning", "violation", "uncertain"])
)

export const overallSafetySchema = z.preprocess(
  (val) => {
    if (typeof val !== "string") return "caution";
    const s = val.toLowerCase().trim();
    if (s.includes("safe") || s === "compliant" || s === "ok" || s === "green") return "safe";
    if (s.includes("caution") || s.includes("warn") || s === "yellow") return "caution";
    if (s.includes("avoid") || s.includes("violat") || s === "unsafe" || s === "red") return "avoid";
    return "caution";
  },
  z.enum(["safe", "caution", "avoid"])
)

export const profileInputSchema = z.object({
  tradition: traditionSchema,
  subTradition: z.string().trim().nullable().optional(),
  strictness: strictnessSchema.optional(),
  allergies: z.array(z.string().trim().min(1)).default([]),
  dislikes: z.array(z.string().trim().min(1)).default([])
})

export const dishComplianceSchema = z.object({
  name: z.string().trim().min(1),
  status: complianceStatusSchema,
  confidence: z.number().min(0).max(1),
  violations: z.array(z.string()).nullable().transform((val) => val ?? []).default([]),
  violationReason: z.string().nullable().default(null),
  hiddenRisk: z.string().nullable().default(null),
  alternatives: z.array(z.string()).nullable().transform((val) => val ?? []).default([]),
  observanceNote: z.string().nullable().default(null),
  askKitchen: z.array(z.string()).nullable().transform((val) => val ?? []).default([])
})

export const scanResultSchema = z.object({
  restaurant: z.string().nullable().default(null),
  scanId: z.string().optional(),
  dishes: z.array(dishComplianceSchema).nullable().transform((val) => val ?? []).default([]),
  overallSafety: overallSafetySchema.default("caution"),
  observanceAlert: z.string().nullable().default(null),
  safeCount: z.number().int().nonnegative().optional(),
  warningCount: z.number().int().nonnegative().optional(),
  violationCount: z.number().int().nonnegative().optional(),
  uncertainCount: z.number().int().nonnegative().optional(),
  isDemoMode: z.boolean().optional(),
  createdAt: z.string().optional()
})
