import { BottomNav } from "@/components/layout/BottomNav"
import { getGuideForTradition, sourceBackedGuides } from "@/lib/religious-sources"
import { createClient } from "@/lib/supabase/server"
import type { Tradition } from "@/types"
import { BookOpenCheck, ExternalLink } from "lucide-react"
import Link from "next/link"

export default async function GuidePage() {
  let tradition: Tradition = "satvik"

  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase.from("profiles").select("tradition").eq("id", user.id).maybeSingle()
      if (data?.tradition) tradition = data.tradition as Tradition
    }
  } catch {
    // Local demo mode uses the founder persona.
  }

  const primaryGuide = getGuideForTradition(tradition)
  const guides = [primaryGuide, ...sourceBackedGuides.filter((guide) => guide.tradition !== tradition)]

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-8">
      <h1 className="font-heading text-[32px] font-semibold text-[#1A1A1A]">Practice Guide</h1>
      <p className="mt-2 text-sm leading-6 text-[#666666]">
        Source-backed checklists for the ingredients Bhojan should question before calling something safe.
      </p>

      <div className="mt-8 grid gap-4">
        {guides.map((guide) => (
          <article className="rounded-2xl border border-[#E8E3DC] bg-white p-6 shadow-sm" key={guide.tradition}>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF8E1] text-[#C17A2E]">
                <BookOpenCheck className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-normal text-[#C17A2E]">{guide.tradition}</p>
                <h2 className="mt-1 font-heading text-2xl font-medium text-[#1A1A1A]">{guide.title}</h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {guide.checks.map((check) => (
                <p className="rounded-xl bg-[#FAFAF7] p-3 text-sm leading-6 text-[#1A1A1A]" key={check}>
                  {check}
                </p>
              ))}
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-normal text-[#666666]">Kitchen questions</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[#1A1A1A]">
                {guide.kitchenQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>

            <Link className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#E8E3DC] px-4 text-sm font-medium text-[#C17A2E]" href={guide.sourceUrl}>
              {guide.sourceLabel}
              <ExternalLink className="size-4" />
            </Link>
          </article>
        ))}
      </div>

      <BottomNav />
    </main>
  )
}
