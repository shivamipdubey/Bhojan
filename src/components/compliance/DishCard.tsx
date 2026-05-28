"use client"

import { StatusBadge } from "@/components/compliance/StatusBadge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { STATUS_STYLES, type ComplianceStatus, type DishCompliance } from "@/types"
import { ChevronDown, CircleAlert, ShieldCheck, Sparkles } from "lucide-react"
import { useState } from "react"

interface FamilyCompliance {
  name: string
  status: ComplianceStatus
  reason: string | null
}

export function DishCard({
  dish,
  familyCompliances = []
}: {
  dish: DishCompliance
  familyCompliances?: FamilyCompliance[]
}) {
  const [open, setOpen] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  return (
    <article className={`rounded-2xl border p-6 shadow-sm transition ${isVerified ? 'border-[#2E7D5B] bg-[#EDF7F2]/5' : 'border-[#E8E3DC] bg-white'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-heading text-[22px] font-medium leading-7 text-[#1A1A1A]">
            {dish.name}
          </h3>
          <p className="mt-2 font-mono text-xs text-[#666666]">
            {Math.round(dish.confidence * 100)}% confidence
          </p>
        </div>
        {isVerified ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#2E7D5B]/30 bg-[#EDF7F2] px-3 py-1.5 text-xs font-bold text-[#2E7D5B] capitalize shrink-0">
            ✓ Verified Safe
          </span>
        ) : (
          <StatusBadge status={dish.status} />
        )}
      </div>

      {dish.violationReason ? (
        <div className="mt-5 flex gap-3 rounded-xl bg-[#FAFAF7] p-4">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#C17A2E]" />
          <p className="text-sm leading-6 text-[#1A1A1A]">{dish.violationReason}</p>
        </div>
      ) : (
        <div className="mt-5 flex gap-3 rounded-xl bg-[#EDF7F2] p-4">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#2E7D5B]" />
          <p className="text-sm leading-6 text-[#2E7D5B]">
            No explicit conflicts found for your saved practice.
          </p>
        </div>
      )}

      {dish.violations.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {dish.violations.map((violation) => (
            <span
              className="rounded-full bg-[#FDECEA] px-3 py-1 text-xs font-medium text-[#C0392B]"
              key={violation}
            >
              {violation}
            </span>
          ))}
        </div>
      ) : null}

      {dish.hiddenRisk ? (
        <p className="mt-4 text-sm leading-6 text-[#666666]">
          <span className="font-medium text-[#1A1A1A]">Hidden risk:</span> {dish.hiddenRisk}
        </p>
      ) : null}

      {dish.observanceNote ? (
        <p className="mt-4 rounded-xl border border-[#B8860B]/20 bg-[#FFF8E1] p-3 text-sm leading-6 text-[#7A5B08]">
          {dish.observanceNote}
        </p>
      ) : null}

      {/* Smart culinary Practice Swap */}
      {(() => {
        const reason = (dish.violationReason || "").toLowerCase()
        const violationsList = dish.violations.map(v => v.toLowerCase())
        
        let swap = null
        if (reason.includes("garlic") || reason.includes("onion") || reason.includes("alliums") || violationsList.some(v => v.includes("onion") || v.includes("garlic"))) {
          swap = "Ask the kitchen to swap onions/garlic with hing (asafoetida), fresh ginger, and coriander to lock in rich flavors."
        } else if (reason.includes("meat") || reason.includes("pork") || reason.includes("chicken") || reason.includes("beef") || reason.includes("gelatin")) {
          swap = "Request the kitchen to substitute animal protein with paneer, firm tofu, or portobello mushrooms prepared on clean surfaces."
        } else if (reason.includes("alcohol") || reason.includes("wine") || reason.includes("cooking wine")) {
          swap = "Ask the chef to deglaze with organic apple cider vinegar, fresh lemon juice, or rich vegetable stock instead of alcohol."
        } else if (reason.includes("lard") || reason.includes("animal fat") || reason.includes("bacon")) {
          swap = "Ask the server if the dish can be cooked in clean vegetable oil, extra virgin olive oil, or pure butter instead of animal fats."
        } else if (reason.includes("dairy") || reason.includes("cheese") || reason.includes("milk")) {
          swap = "Request substituting traditional dairy with high-quality olive oil, nutritional yeast, or plant-based coconut oil alternatives."
        } else if (reason.includes("nut") || reason.includes("peanut") || reason.includes("almond")) {
          swap = "Request the kitchen to omit the nuts and garnish with toasted pumpkin seeds or sesame seeds to add safe crunch."
        }

        if (!swap) return null

        return (
          <div className="mt-4 rounded-xl border border-[#4A6741]/20 bg-[#FAFAF7] p-4 flex gap-3">
            <Sparkles className="mt-0.5 size-4.5 shrink-0 text-[#4A6741]" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#4A6741]">Practice Swap</p>
              <p className="mt-1 text-sm leading-6 text-[#1A1A1A] font-semibold">{swap}</p>
            </div>
          </div>
        )
      })()}

      {dish.alternatives.length > 0 ? (
        <Collapsible className="mt-4" onOpenChange={setOpen} open={open}>
          <CollapsibleTrigger className="flex min-h-11 w-full items-center justify-between rounded-xl border border-[#E8E3DC] px-4 text-sm font-medium text-[#1A1A1A]">
            Safer alternatives
            <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <ul className="space-y-2 text-sm text-[#666666]">
              {dish.alternatives.map((alternative) => (
                <li className="rounded-xl bg-[#FAFAF7] px-4 py-3" key={alternative}>
                  {alternative}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      {(dish.askKitchen?.length ?? 0) > 0 ? (
        <div className="mt-4 rounded-xl border border-[#E8E3DC] bg-[#FAFAF7] p-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-[#666666]">Ask the kitchen</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#1A1A1A]">
            {(dish.askKitchen ?? []).map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Render Family Member Compliances */}
      {familyCompliances && familyCompliances.length > 0 && (
        <div className="mt-5 border-t border-[#E8E3DC]/60 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-2">Family Profiles Compliance</p>
          <div className="flex flex-wrap gap-2">
            {familyCompliances.map((member) => (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                key={member.name}
                style={{
                  borderColor: STATUS_STYLES[member.status].border + "30",
                  color: STATUS_STYLES[member.status].text,
                  backgroundColor: STATUS_STYLES[member.status].bg
                }}
                title={member.reason || "Compliant"}
              >
                <span className="font-semibold">{member.name}:</span>
                <span className="capitalize">{member.status}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Verify Safe Toggle */}
      {dish.status !== "safe" && (
        <div className="mt-5 flex items-center justify-between border-t border-[#E8E3DC]/40 pt-4">
          <span className="text-xs text-[#666666] leading-none">
            {isVerified ? "✓ Verified safe for this meal" : "Asked the server and confirmed safe?"}
          </span>
          <button
            className={`min-h-9 px-3.5 py-1.5 rounded-full border text-[11px] font-bold transition cursor-pointer ${
              isVerified
                ? "border-[#2E7D5B] bg-[#EDF7F2] text-[#2E7D5B]"
                : "border-[#E8E3DC] bg-white text-[#666666] hover:bg-[#FAFAF7]"
            }`}
            onClick={() => setIsVerified(!isVerified)}
          >
            {isVerified ? "✓ Verified" : "Verify Safe"}
          </button>
        </div>
      )}
    </article>
  )
}

