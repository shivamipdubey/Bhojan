import { BottomNav } from "@/components/layout/BottomNav"
import { getMarketplaceItemsForTradition } from "@/lib/demo-data"
import { createClient } from "@/lib/supabase/server"
import type { Tradition } from "@/types"
import { ShoppingBag } from "lucide-react"

export default async function MarketplacePage() {
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
    // Demo mode defaults to the founder persona.
  }

  const items = getMarketplaceItemsForTradition(tradition)

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-8">
      <h1 className="font-heading text-[32px] font-semibold text-[#1A1A1A]">Ritual Shop</h1>
      <p className="mt-2 text-sm leading-6 text-[#666666]">
        Mock checkout kits for upcoming observances and practice-specific pantry needs.
      </p>
      <p className="mt-4 rounded-2xl bg-[#FFF8E1] p-4 text-sm text-[#7A5B08]">
        Showing products for your {tradition} profile.
      </p>

      <div className="mt-8 grid gap-4">
        {items.map((item) => (
          <article className="rounded-2xl border border-[#E8E3DC] bg-white p-5 shadow-sm" key={item.id}>
            <div className="flex gap-4">
              <div className="flex aspect-square w-20 shrink-0 items-center justify-center rounded-xl bg-[#F5F0E8] text-[#C17A2E]">
                <ShoppingBag className="size-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[#1A1A1A]">{item.name}</h2>
                    <p className="mt-1 text-xs text-[#666666]">{item.category}</p>
                  </div>
                  <p className="font-mono text-sm text-[#1A1A1A]">${item.price.toFixed(2)}</p>
                </div>
                <p className="mt-3 text-sm leading-5 text-[#666666]">{item.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <BottomNav />
    </main>
  )
}
