import { demoObservances } from "@/lib/demo-data"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tradition = searchParams.get("tradition") ?? "satvik"
  const days = Number(searchParams.get("days") ?? 30)
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("observances")
      .select("*")
      .eq("tradition", tradition)
      .gte("start_date", new Date().toISOString().slice(0, 10))
      .lte("start_date", endDate.toISOString().slice(0, 10))
      .order("start_date", { ascending: true })

    if (!error && data?.length) {
      return NextResponse.json({ observances: data })
    }
  } catch {
    // Fall through to seeded demo observances.
  }

  return NextResponse.json({
    observances: demoObservances.filter((item) => item.tradition === tradition)
  })
}
