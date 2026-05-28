import { DishCard } from "@/components/compliance/DishCard"
import { BottomNav } from "@/components/layout/BottomNav"
import { KitSuggestion } from "@/components/marketplace/KitSuggestion"
import { sampleScanResult } from "@/lib/demo-data"
import { createClient } from "@/lib/supabase/server"
import type { ScanResult, Tradition } from "@/types"
import Link from "next/link"

type ScanRow = {
  id: string
  restaurant_name: string | null
  tradition: Tradition | null
  scan_result: ScanResult
  created_at: string
}

export default async function ScanDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let scan: ScanRow = {
    id: "demo",
    restaurant_name: sampleScanResult.restaurant,
    tradition: "satvik",
    scan_result: sampleScanResult,
    created_at: new Date().toISOString()
  }

  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (user && id !== "demo") {
      const { data } = await supabase
        .from("scans")
        .select("id, restaurant_name, tradition, scan_result, created_at")
        .eq("user_id", user.id)
        .eq("id", id)
        .maybeSingle()

      if (data) scan = data as ScanRow
    }
  } catch {
    // Demo detail remains available without Supabase.
  }

  const result = scan.scan_result

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-8">
      <Link className="text-sm font-medium text-[#C17A2E]" href="/history">
        Back to history
      </Link>
      <p className="mt-6 text-sm font-medium text-[#C17A2E]">{result.restaurant ?? scan.restaurant_name ?? "Menu scan"}</p>
      <h1 className="mt-1 font-heading text-[32px] font-semibold text-[#1A1A1A]">Saved result</h1>

      {result.observanceAlert ? (
        <p className="mt-5 rounded-2xl border border-[#B8860B]/20 bg-[#FFF8E1] p-4 text-sm leading-6 text-[#7A5B08]">
          {result.observanceAlert}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4">
        {result.dishes.map((dish) => (
          <DishCard dish={dish} key={dish.name} />
        ))}
      </div>

      <div className="mt-5">
        <KitSuggestion tradition={scan.tradition ?? "satvik"} />
      </div>

      <BottomNav />
    </main>
  )
}
