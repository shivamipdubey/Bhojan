import { BottomNav } from "@/components/layout/BottomNav"
import { ObservanceBanner } from "@/components/observance/ObservanceBanner"
import { Logo } from "@/components/layout/Logo"
import { FastingSolarTracker } from "@/components/observance/FastingSolarTracker"
import { demoObservances, sampleScanResult } from "@/lib/demo-data"
import { createClient } from "@/lib/supabase/server"
import type { Observance, ScanRecord } from "@/types"
import { CalendarDays, ScanLine, ShoppingBag, Activity, TrendingUp } from "lucide-react"
import Link from "next/link"

type ProfileRow = {
  id: string
  tradition: string
  sub_tradition?: string | null
  strictness?: string
}

type ScanRow = {
  id: string
  restaurant_name: string | null
  scan_result: ScanRecord["scanResult"]
  created_at: string
}

const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date))

const daysUntil = (date: string) => {
  const start = new Date("2026-05-25T00:00:00+05:30")
  const target = new Date(`${date}T00:00:00+05:30`)
  return Math.max(0, Math.round((target.getTime() - start.getTime()) / 86_400_000))
}

const dotClass = {
  safe: "bg-[#2E7D5B]",
  caution: "bg-[#B8860B]",
  avoid: "bg-[#C0392B]"
}

export default async function DashboardPage() {
  let email = "there"
  let profile: ProfileRow | null = { id: "demo", tradition: "satvik" }
  let scans: ScanRow[] = [
    {
      id: "demo",
      restaurant_name: sampleScanResult.restaurant,
      scan_result: sampleScanResult,
      created_at: new Date().toISOString()
    }
  ]
  let observances: Observance[] = demoObservances.filter((item) => item.tradition === "satvik")

  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (user) {
      email = user.email?.split("@")[0] ?? "there"

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, tradition, sub_tradition, strictness")
        .eq("id", user.id)
        .maybeSingle()

      profile = profileData ?? profile

      const { data: scanData } = await supabase
        .from("scans")
        .select("id, restaurant_name, scan_result, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3)

      if (scanData?.length) scans = scanData as ScanRow[]

      const { data: observanceData } = await supabase
        .from("observances")
        .select("*")
        .eq("tradition", profile?.tradition ?? "satvik")
        .gte("start_date", new Date().toISOString().slice(0, 10))
        .order("start_date", { ascending: true })
        .limit(3)

      if (observanceData?.length) {
        observances = observanceData.map((item) => ({
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
      }
    }
  } catch {
    // Dashboard remains demo-ready if Supabase is unavailable.
  }

  const nextObservance = observances[0]
  const nextObservanceDays = nextObservance ? daysUntil(nextObservance.nextOccurrence) : null
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-8">
      <Logo className="mb-6" />
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-[28px] font-semibold text-[#1A1A1A]">Good morning, {email}</h1>
        <div className="flex size-11 items-center justify-center rounded-full bg-[#C17A2E] text-sm font-semibold text-white">
          {initials}
        </div>
      </div>

      <div className="mt-8 grid gap-5">
        <FastingSolarTracker />

        {nextObservance && nextObservanceDays !== null && nextObservanceDays <= 7 ? (
          <ObservanceBanner
            days={nextObservanceDays}
            name={nextObservance.name}
            note={nextObservance.dietaryChanges[0] ?? nextObservance.description}
          />
        ) : null}

        <Link className="block rounded-2xl bg-[#C17A2E] p-8 text-white shadow-md" href="/scan">
          <ScanLine className="size-8" />
          <h2 className="mt-5 font-heading text-2xl font-medium">Scan a Menu</h2>
          <p className="mt-2 text-sm text-white/85">Find out what you can eat</p>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Link className="rounded-2xl border border-[#E8E3DC] bg-white p-5 shadow-sm" href="/observance">
            <CalendarDays className="size-5 text-[#4A6741]" />
            <p className="mt-4 text-sm font-semibold text-[#1A1A1A]">My Calendar</p>
          </Link>
          <Link className="rounded-2xl border border-[#E8E3DC] bg-white p-5 shadow-sm" href="/marketplace">
            <ShoppingBag className="size-5 text-[#4A6741]" />
            <p className="mt-4 text-sm font-semibold text-[#1A1A1A]">Ritual Shop</p>
          </Link>
        </div>

        {/* Dietary Analytics Section */}
        <section className="rounded-3xl border border-[#E8E3DC] bg-white p-6 shadow-sm relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 size-36 rounded-full bg-[#FAFAF7] opacity-60 blur-xl" />
          
          <div className="flex items-center gap-2 border-b border-[#E8E3DC]/40 pb-4">
            <Activity className="size-5 text-[#C17A2E]" />
            <h2 className="font-heading text-xl font-semibold text-[#1A1A1A]">Dietary Analytics</h2>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#FAFAF7] p-4 border border-[#E8E3DC]/30">
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#2E7D5B] uppercase tracking-wider">
                <TrendingUp className="size-3" /> Safety Index
              </span>
              <p className="mt-2 font-mono text-2xl font-bold text-[#1A1A1A]">88%</p>
              <p className="mt-1 text-[11px] text-[#666666] leading-4">Ingredients safe for your practice</p>
            </div>
            
            <div className="rounded-2xl bg-[#FAFAF7] p-4 border border-[#E8E3DC]/30">
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#C17A2E] uppercase tracking-wider">
                ⚡ Mindfulness
              </span>
              <p className="mt-2 font-mono text-2xl font-bold text-[#1A1A1A]">5/7</p>
              <p className="mt-1 text-[11px] text-[#666666] leading-4">Fasting solar windows kept this week</p>
            </div>
          </div>

          {/* Common Risks Visual Tracker */}
          <div className="mt-5 space-y-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Risks Automatically Avoided</p>
            
            {[
              { label: "Hidden Alliums (garlic/onion)", count: 6, total: 10, color: "bg-[#C17A2E]" },
              { label: "Alcoholic Glazes", count: 2, total: 10, color: "bg-[#B8860B]" },
              { label: "Hidden Meat Derivatives", count: 4, total: 10, color: "bg-[#C0392B]" }
            ].map((risk) => (
              <div key={risk.label}>
                <div className="flex items-center justify-between text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  <span>{risk.label}</span>
                  <span className="font-mono text-[#666666]">{risk.count} flagged</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#FAFAF7] overflow-hidden border border-[#E8E3DC]/30">
                  <div
                    className={`h-full rounded-full ${risk.color}`}
                    style={{ width: `${(risk.count / risk.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-2xl font-medium text-[#1A1A1A]">Recent Scans</h2>
          <div className="mt-4 space-y-3">
            {scans.length ? (
              scans.map((scan) => (
                <Link className="flex items-center justify-between rounded-2xl border border-[#E8E3DC] bg-white p-4 shadow-sm" href={`/scan/${scan.id}`} key={scan.id}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1A1A1A]">
                      {scan.restaurant_name ?? scan.scan_result.restaurant ?? "Menu scan"}
                    </p>
                    <p className="mt-1 text-xs text-[#666666]">{dateLabel(scan.created_at)}</p>
                  </div>
                  <span className={`size-3 rounded-full ${dotClass[scan.scan_result.overallSafety]}`} />
                </Link>
              ))
            ) : (
              <p className="rounded-2xl border border-[#E8E3DC] bg-white p-5 text-sm text-[#666666]">
                Scan your first menu to see results here.
              </p>
            )}
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  )
}
