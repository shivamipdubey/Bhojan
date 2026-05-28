"use client"

import { X } from "lucide-react"
import { useState } from "react"

export function ObservanceBanner({
  name,
  days,
  note
}: {
  name: string
  days: number
  note: string
}) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="rounded-2xl border border-[#B8860B]/20 bg-[#FFF8E1] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#B8860B]" />
            <p className="text-sm font-semibold text-[#7A5B08]">
              {name} in {days} days
            </p>
          </div>
          <p className="mt-1 text-xs leading-5 text-[#666666]">{note}</p>
          <p className="mt-3 text-sm font-medium text-[#C17A2E]">Order Prep Kit -&gt;</p>
        </div>
        <button
          aria-label="Dismiss observance"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#7A5B08]"
          onClick={() => setDismissed(true)}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
