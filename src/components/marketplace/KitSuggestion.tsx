import { getMarketplaceItemsForTradition } from "@/lib/demo-data"
import type { Tradition } from "@/types"
import { ShoppingBag } from "lucide-react"

export function KitSuggestion({
  tradition = "satvik",
  observanceName = "Ekadashi"
}: {
  tradition?: Tradition
  observanceName?: string | null
}) {
  const items = getMarketplaceItemsForTradition(tradition, observanceName)
  const heading = observanceName ? `Prepare for ${observanceName}` : "Practice kit"

  return (
    <section className="rounded-2xl border border-[#E8E3DC] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-[#FFF8E1] text-[#C17A2E]">
          <ShoppingBag className="size-5" />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-medium">{heading}</h2>
          <p className="text-sm text-[#666666]">Vrat essentials for the next observance.</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div className="flex items-center justify-between rounded-xl bg-[#FAFAF7] p-3" key={item.id}>
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">{item.name}</p>
              <p className="text-xs text-[#666666]">{item.category}</p>
            </div>
            <p className="font-mono text-sm text-[#1A1A1A]">${item.price.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <button className="mt-5 min-h-11 w-full rounded-full bg-[#C17A2E] px-6 text-sm font-medium text-white">
        Order Suggested Kit
      </button>
    </section>
  )
}
