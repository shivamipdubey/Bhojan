"use client"

import { BottomNav } from "@/components/layout/BottomNav"
import { Logo } from "@/components/layout/Logo"
import { sampleScanResult } from "@/lib/demo-data"
import { createClient } from "@/lib/supabase/client"
import type { ScanRecord } from "@/types"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Trash2, ShieldAlert, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"

type ScanRow = {
  id: string
  restaurant_name: string | null
  scan_result: ScanRecord["scanResult"]
  created_at: string
}

const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(date))

const dotClass = {
  safe: "bg-[#2E7D5B]",
  caution: "bg-[#B8860B]",
  avoid: "bg-[#C0392B]"
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
}

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "safe" | "caution" | "avoid">("all")

  // Fetch scans on mount
  useEffect(() => {
    const fetchScans = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data, error } = await supabase
            .from("scans")
            .select("id, restaurant_name, scan_result, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

          if (error) throw error
          
          if (data && data.length) {
            setScans(data as ScanRow[])
          } else {
            // Default demo fallback if database is empty
            setScans([
              {
                id: "demo",
                restaurant_name: sampleScanResult.restaurant,
                scan_result: sampleScanResult,
                created_at: new Date().toISOString()
              }
            ])
          }
        } else {
          // Local demo fallback for guest users
          setScans([
            {
              id: "demo",
              restaurant_name: sampleScanResult.restaurant,
              scan_result: sampleScanResult,
              created_at: new Date().toISOString()
            }
          ])
        }
      } catch {
        toast.error("Failed to load scan history.")
      } finally {
        setLoading(false)
      }
    }
    void fetchScans()
  }, [])

  // Delete past scan row
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (id === "demo") {
      toast.warning("Cannot delete the demo scan.")
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from("scans").delete().eq("id", id)

      if (error) throw error

      setScans((current) => current.filter((scan) => scan.id !== id))
      toast.success("Scan deleted successfully.")
    } catch {
      toast.error("Failed to delete the scan.")
    }
  }

  // Live filtering and search query matching
  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      const name = scan.restaurant_name ?? scan.scan_result.restaurant ?? "Menu scan"
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase())
      
      const safety = scan.scan_result.overallSafety || "caution"
      const matchesFilter = activeFilter === "all" || safety === activeFilter

      return matchesSearch && matchesFilter
    })
  }, [scans, searchQuery, activeFilter])

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-8">
      <Logo className="mb-6" />
      <h1 className="font-heading text-[32px] font-semibold text-[#1A1A1A]">Scan History</h1>
      <p className="mt-2 text-sm leading-6 text-[#666666]">
        Reopen past decisions and compare how your practice shaped each result.
      </p>

      {/* Real-time search input */}
      <div className="relative mt-6">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#666666]" />
        <input
          className="min-h-12 w-full rounded-2xl border border-[#E8E3DC] bg-white pl-11 pr-4 text-sm text-[#1A1A1A] outline-none placeholder:text-[#666666] focus:border-[#C17A2E]/60 transition"
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by restaurant name..."
          type="text"
          value={searchQuery}
        />
      </div>

      {/* Filter Chips */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {["all", "safe", "caution", "avoid"].map((filter) => (
          <button
            className={`min-h-9 shrink-0 rounded-full border px-4 text-xs font-semibold capitalize transition ${
              activeFilter === filter
                ? "border-[#C17A2E] bg-[#C17A2E] text-white"
                : "border-[#E8E3DC] bg-white text-[#666666]"
            }`}
            key={filter}
            onClick={() => setActiveFilter(filter as "all" | "safe" | "caution" | "avoid")}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Scans Listing */}
      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="size-8 text-[#C17A2E] animate-spin" />
            <p className="mt-3 text-sm font-medium text-[#666666]">Retrieving scan records...</p>
          </div>
        ) : (
          <motion.div
            animate="show"
            className="grid gap-3.5"
            initial="hidden"
            variants={containerVariants}
          >
            <AnimatePresence mode="popLayout">
              {filteredScans.length ? (
                filteredScans.map((scan) => (
                  <motion.div
                    exit="exit"
                    key={scan.id}
                    layout
                    variants={itemVariants}
                  >
                    <Link
                      className="flex items-center justify-between rounded-2xl border border-[#E8E3DC] bg-white p-4 shadow-sm hover:border-[#C17A2E]/30 transition group"
                      href={`/scan/${scan.id}`}
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="truncate text-sm font-semibold text-[#1A1A1A]">
                          {scan.restaurant_name ?? scan.scan_result.restaurant ?? "Menu scan"}
                        </p>
                        <p className="mt-1 text-xs text-[#666666]">{dateLabel(scan.created_at)}</p>
                      </div>
                      
                      <div className="flex items-center gap-3.5 shrink-0">
                        <span className={`size-3 rounded-full ${dotClass[scan.scan_result.overallSafety || "caution"]}`} />
                        {scan.id !== "demo" && (
                          <button
                            aria-label={`Delete scan at ${scan.restaurant_name}`}
                            className="rounded p-1 text-[#666666]/60 hover:bg-[#FDECEA] hover:text-[#C0392B] opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                            onClick={(e) => handleDelete(e, scan.id)}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-[#E8E3DC]/60 bg-white p-8 text-center shadow-sm">
                  <ShieldAlert className="size-8 text-[#C17A2E]/60" />
                  <p className="mt-4 text-sm font-semibold text-[#1A1A1A]">No matches found</p>
                  <p className="mt-1 text-xs text-[#666666]">Try expanding your query or filtering chips.</p>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
