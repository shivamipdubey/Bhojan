import { BottomNav } from "@/components/layout/BottomNav"
import { getObservancesForTradition } from "@/lib/demo-data"
import { createClient } from "@/lib/supabase/server"
import type { Observance, Tradition } from "@/types"
import { CalendarDays } from "lucide-react"

const daysUntil = (date: string) => {
  const start = new Date("2026-05-25T00:00:00+05:30")
  const target = new Date(`${date}T00:00:00+05:30`)
  return Math.max(0, Math.round((target.getTime() - start.getTime()) / 86_400_000))
}

export default async function ObservancePage() {
  let tradition: Tradition = "satvik"
  let observances: Observance[] = getObservancesForTradition(tradition)

  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase.from("profiles").select("tradition").eq("id", user.id).maybeSingle()
      if (profile?.tradition) tradition = profile.tradition as Tradition

      const { data } = await supabase
        .from("observances")
        .select("*")
        .eq("tradition", tradition)
        .gte("start_date", new Date().toISOString().slice(0, 10))
        .order("start_date", { ascending: true })

      if (data?.length) {
        observances = data.map((item) => ({
          id: item.id,
          tradition: item.tradition,
          name: item.name,
          description: item.description,
          startDate: item.start_date,
          endDate: item.end_date,
          dietaryChanges: item.dietary_rules?.changes ?? [],
          ritualItems: item.ritual_items ?? [],
          isRecurring: item.is_recurring,
          nextOccurrence: item.start_date
        }))
      } else {
        observances = getObservancesForTradition(tradition)
      }
    }
  } catch {
    observances = getObservancesForTradition(tradition)
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-8">
      <h1 className="font-heading text-[32px] font-semibold text-[#1A1A1A]">Observance</h1>
      <p className="mt-2 text-sm leading-6 text-[#666666]">
        Upcoming practice-aware moments that can change what counts as safe.
      </p>
      <p className="mt-4 rounded-2xl bg-[#FFF8E1] p-4 text-sm text-[#7A5B08]">
        Showing observances for your {tradition} profile.
      </p>

      <div className="mt-8 grid gap-4">
        {observances.map((observance) => (
          <article className="rounded-2xl border border-[#E8E3DC] bg-white p-6 shadow-sm" key={observance.id}>
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FFF8E1] text-[#C17A2E]">
                <CalendarDays className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-normal text-[#C17A2E]">
                  In {daysUntil(observance.nextOccurrence)} days
                </p>
                <h2 className="mt-1 font-heading text-2xl font-medium text-[#1A1A1A]">{observance.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[#666666]">{observance.description}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {observance.dietaryChanges.map((change) => (
                <span className="rounded-full bg-[#F5F0E8] px-3 py-1 text-xs font-medium text-[#1A1A1A]" key={change}>
                  {change}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <BottomNav />
    </main>
  )
}
