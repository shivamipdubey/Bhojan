"use client"

import { DishCard } from "@/components/compliance/DishCard"
import { BottomNav } from "@/components/layout/BottomNav"
import { KitSuggestion } from "@/components/marketplace/KitSuggestion"
import { KitchenCardModal } from "@/components/scanner/KitchenCardModal"
import { MenuChatPanel } from "@/components/scanner/MenuChatPanel"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { demoPersonas } from "@/lib/demo-data"
import { normalizeProfile, type PracticeProfile } from "@/lib/profile"
import { validateScanResult } from "@/lib/rules-engine"
import { cn } from "@/lib/utils"
import type { ComplianceStatus, ScanResult, Strictness, Tradition } from "@/types"
import { motion, AnimatePresence } from "framer-motion"
import { RotateCcw, ScanLine, Languages, Users, Map, List, Check, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"

type ScanState = "upload" | "preview" | "scanning" | "results"

const filters: Array<"all" | ComplianceStatus> = ["all", "safe", "warning", "violation", "uncertain"]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } }
}

const resizeAndCompressImage = (
  file: File,
  maxWidth = 1200,
  maxHeight = 1200
): Promise<{ base64: string; mimeType: string; dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = document.createElement("img")
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas context could not be created"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        
        // Compress as JPEG for extremely small network payload size (~100kb) and optimal local/cloud AI visual scanning speed
        const mimeType = "image/jpeg"
        const dataUrl = canvas.toDataURL(mimeType, 0.85) // 85% quality provides perfect legibility for OCR
        const [, base64 = ""] = dataUrl.split(",")

        resolve({ base64, mimeType, dataUrl })
      }
      img.onerror = reject
      img.src = String(e.target?.result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}


const getSavedProfile = () => {
  if (typeof window === "undefined") {
    return normalizeProfile()
  }

  const saved = window.localStorage.getItem("bhojan-profile")
  if (!saved) return normalizeProfile()

  try {
    return normalizeProfile(JSON.parse(saved) as Partial<PracticeProfile>)
  } catch {
    return normalizeProfile()
  }
}

interface FamilyProfile {
  id: string
  name: string
  tradition: Tradition
  subTradition: string | null
  strictness: Strictness
  allergies: string[]
  dislikes: string[]
}

export function ScanClient({ initialDemo = false }: { initialDemo?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<ScanState>(initialDemo ? "scanning" : "upload")
  const [preview, setPreview] = useState<string | null>(null)
  const [fileMeta, setFileMeta] = useState<{ base64: string; mimeType: string } | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | ComplianceStatus>("all")
  const [viewMode, setViewMode] = useState<"list" | "visual">("list")

  // Geolocation and Family states
  const [familyProfiles] = useState<FamilyProfile[]>(() => {
    if (typeof window === "undefined") return []
    const saved = window.localStorage.getItem("bhojan-family-profiles")
    return saved ? JSON.parse(saved) : []
  })
  
  // Selected party members state ("me" = primary user)
  const [selectedParty, setSelectedParty] = useState<string[]>(["me"])
  const [showKitchenModal, setShowKitchenModal] = useState(false)

  const togglePartyMember = (id: string) => {
    setSelectedParty((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  const activeProfiles = useMemo(() => {
    const list = []
    if (selectedParty.includes("me")) {
      list.push(getSavedProfile())
    }
    for (const f of familyProfiles) {
      if (selectedParty.includes(f.id)) {
        list.push(f)
      }
    }
    return list
  }, [selectedParty, familyProfiles])

  // Compiles combined profile guidelines to pass to KitchenCardModal
  const combinedProfile = useMemo(() => {
    const base = getSavedProfile()
    if (!activeProfiles.length) return base

    const traditions = Array.from(new Set(activeProfiles.map(p => p.tradition)))
    const allergies = Array.from(new Set(activeProfiles.flatMap(p => p.allergies)))
    const dislikes = Array.from(new Set(activeProfiles.flatMap(p => p.dislikes)))

    let strictness: Strictness = "standard"
    if (activeProfiles.some(p => p.strictness === "strict")) {
      strictness = "strict"
    } else if (activeProfiles.some(p => p.strictness === "festival")) {
      strictness = "festival"
    }

    return {
      tradition: traditions.length === 1 ? traditions[0] : "custom",
      traditions,
      subTradition: base.subTradition,
      strictness,
      allergies,
      dislikes
    }
  }, [activeProfiles])

  const scan = async (demo = false) => {
    setState("scanning")
    setError(null)
    try {
      const profile = getSavedProfile()
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demo,
          imageBase64: fileMeta?.base64,
          mimeType: fileMeta?.mimeType,
          profile: { ...profile, activeObservances: ["Ekadashi"] }
        })
      })

      const data = await response.json()
      if (!response.ok || (data && data.error)) {
        throw new Error(data?.error || `Request failed with status ${response.status}`)
      }

      setResult(data as ScanResult)
      setState("results")
    } catch (err: unknown) {
      console.error("Scan error details:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred during scanning.")
      if (preview) {
        setState("preview")
      } else {
        setState("upload")
      }
    }
  }

  useEffect(() => {
    if (!initialDemo) return

    const run = async () => {
      setState("scanning")
      setError(null)
      try {
        const profile = getSavedProfile()
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            demo: true,
            profile: { ...profile, activeObservances: ["Ekadashi"] }
          })
        })

        const data = await response.json()
        if (!response.ok || (data && data.error)) {
          throw new Error(data?.error || `Request failed with status ${response.status}`)
        }

        setResult(data as ScanResult)
        setState("results")
      } catch (err: unknown) {
        console.error("Demo run failed:", err)
        setError(err instanceof Error ? err.message : "Failed to load demo menu results.")
        setState("upload")
      }
    }

    void run()
  }, [initialDemo])

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      const { base64, mimeType, dataUrl } = await resizeAndCompressImage(file)
      setPreview(dataUrl)
      setFileMeta({ base64, mimeType })
      setState("preview")
    } catch (err: unknown) {
      console.error("Failed to process image:", err)
      setError("Failed to process or compress the image. Please try a different photo.")
      setState("upload")
    }
  }

  // Calculate scan results in parallel for each family member
  const familyMemberScanResults = useMemo(() => {
    if (!result || !familyProfiles.length) return {}
    const results: Record<string, ScanResult> = {}
    for (const prof of familyProfiles) {
      results[prof.id] = validateScanResult(result, {
        ...prof,
        activeObservances: ["Ekadashi"]
      })
    }
    return results
  }, [result, familyProfiles])

  // Calculate Party compatibility scores and universally safe items
  const partyCompatibility = useMemo(() => {
    if (!result || !activeProfiles.length) return { score: 100, universalSafeDishes: [] }

    let universallySafeCount = 0
    const universalSafeDishes: string[] = []

    result.dishes.forEach((dish, idx) => {
      let isSafeForEveryone = true

      if (selectedParty.includes("me")) {
        if (dish.status !== "safe") isSafeForEveryone = false
      }

      familyProfiles.forEach((member) => {
        if (selectedParty.includes(member.id)) {
          const memberScan = familyMemberScanResults[member.id]
          const memberDish = memberScan?.dishes[idx]
          if (memberDish?.status !== "safe") {
            isSafeForEveryone = false
          }
        }
      })

      if (isSafeForEveryone) {
        universallySafeCount++
        universalSafeDishes.push(dish.name)
      }
    })

    const total = result.dishes.length || 1
    const score = Math.round((universallySafeCount / total) * 100)

    return {
      score,
      universalSafeDishes
    }
  }, [result, activeProfiles, selectedParty, familyProfiles, familyMemberScanResults])

  const getFamilyCompliancesForDish = (dishIndex: number) => {
    return familyProfiles.map((member) => {
      const memberScan = familyMemberScanResults[member.id]
      const memberDish = memberScan?.dishes[dishIndex]
      return {
        name: member.name,
        status: memberDish?.status ?? "safe",
        reason: memberDish?.violationReason ?? null
      }
    })
  }

  const visibleDishes = result?.dishes.filter((dish) => filter === "all" || dish.status === filter) ?? []

  // Simulated coordinate mappings for OCR visual highlighting
  const ocrBoundingBoxes = useMemo(() => {
    if (!result) return []
    const coordinates = [
      { top: "15%", left: "10%", width: "80%", height: "12%" },
      { top: "30%", left: "10%", width: "80%", height: "12%" },
      { top: "45%", left: "10%", width: "80%", height: "12%" },
      { top: "60%", left: "10%", width: "80%", height: "12%" },
      { top: "75%", left: "10%", width: "80%", height: "12%" }
    ]
    return result.dishes.map((dish, i) => ({
      name: dish.name,
      status: dish.status,
      coords: coordinates[i % coordinates.length]
    }))
  }, [result])

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollToDishCard = (name: string) => {
    setViewMode("list")
    setTimeout(() => {
      const element = document.getElementById(`dish-${name.replace(/\s+/g, "-")}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
        element.classList.add("ring-2", "ring-[#C17A2E]", "ring-offset-2")
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-[#C17A2E]", "ring-offset-2")
        }, 1500)
      }
    }, 100)
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-8">
      {error && state === "upload" ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-[#C0392B]/20 bg-[#FFF1F0] p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 text-[#C0392B] mt-0.5" />
            <div className="flex-1">
              <h3 className="text-xs font-bold text-[#A62424] uppercase tracking-wider font-sans">Scanning Failed</h3>
              <p className="mt-1 text-xs text-[#A62424]/90 font-medium leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold text-[#A62424]/75 hover:text-[#A62424] transition"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      ) : null}

      {state === "upload" ? (
        <section className="flex min-h-[calc(100vh-9rem)] flex-col items-center justify-center">
          <button
            className="w-full rounded-2xl border-2 border-dashed border-[#C17A2E]/40 bg-white p-12 text-center shadow-sm"
            onClick={() => inputRef.current?.click()}
          >
            <ScanLine className="mx-auto size-12 text-[#C17A2E]" />
            <h1 className="mt-5 font-heading text-3xl font-semibold text-[#1A1A1A]">Upload a menu</h1>
            <p className="mt-2 text-sm text-[#666666]">Take a photo or upload an image</p>
          </button>
          <input
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
            ref={inputRef}
            type="file"
          />
          <button className="mt-8 text-sm font-medium text-[#C17A2E] underline" onClick={() => scan(true)}>
            Try Demo
          </button>
          <div className="mt-8 grid w-full gap-2">
            {demoPersonas.map((persona) => (
              <button
                className="rounded-2xl border border-[#E8E3DC] bg-white p-4 text-left shadow-sm hover:border-[#C17A2E]/40 transition"
                key={persona.id}
                onClick={() => {
                  window.localStorage.setItem("bhojan-profile", JSON.stringify(persona.profile))
                  void scan(true)
                }}
              >
                <p className="text-sm font-semibold text-[#1A1A1A]">{persona.name}</p>
                <p className="mt-1 text-xs leading-5 text-[#666666]">{persona.description}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {state === "preview" && preview ? (
        <section className="flex min-h-[calc(100vh-9rem)] flex-col justify-center">
          <div className="rounded-2xl border border-[#E8E3DC] bg-white p-6 text-center shadow-sm">
            <Image
              alt="Uploaded menu preview"
              className="mx-auto max-h-48 rounded-xl object-contain animate-fade-in"
              height={240}
              src={preview}
              style={{ height: "auto" }}
              unoptimized
              width={320}
            />
            <h1 className="mt-6 font-heading text-3xl font-semibold text-[#1A1A1A]">Ready to analyze</h1>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-5 rounded-2xl border border-[#C0392B]/20 bg-[#FFF1F0] p-5 text-left shadow-sm flex items-start gap-3.5"
              >
                <AlertCircle className="size-5 shrink-0 text-[#C0392B] mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-[#A62424] uppercase tracking-wider font-sans">
                    Analysis Failed
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#A62424]/90 font-medium">
                    {error}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => void scan(false)}
                      className="rounded-full bg-[#C0392B] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#A82B1E] active:scale-95 transition shadow-sm"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => setError(null)}
                      className="text-xs font-bold text-[#A62424]/70 hover:text-[#A62424] transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <Button className="mt-6 min-h-12 w-full rounded-full bg-[#C17A2E] text-white hover:bg-[#A66520]" onClick={() => scan()}>
              Scan this menu
            </Button>
            <button
              className="mt-5 text-sm font-medium text-[#C17A2E]"
              onClick={() => {
                setError(null)
                setState("upload")
              }}
            >
              Choose different image
            </button>
          </div>
        </section>
      ) : null}

      {state === "scanning" ? (
        <section className="flex min-h-[calc(100vh-9rem)] flex-col items-center justify-center text-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [1, 0.5, 1] }}
            className="h-24 w-24 rounded-full border-4 border-[#C17A2E]"
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <h1 className="mt-8 font-heading text-3xl font-semibold text-[#1A1A1A]">Analyzing your menu...</h1>
          <p className="mt-2 text-sm text-[#666666]">Checking for hidden ingredients...</p>
          <Progress className="mt-8 h-2 bg-[#F5F0E8] [&>div]:bg-[#C17A2E]" value={64} />
        </section>
      ) : null}

      {state === "results" && result ? (
        <section ref={scrollContainerRef}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#C17A2E]">{result.restaurant ?? "Menu scan"}</p>
              <h1 className="mt-1 font-heading text-[32px] font-semibold text-[#1A1A1A]">Compliance results</h1>
            </div>
            <button
              aria-label="Start over"
              className="flex size-11 items-center justify-center rounded-full border border-[#E8E3DC] bg-white hover:bg-[#FAFAF7]"
              onClick={() => {
                setResult(null)
                setPreview(null)
                setFileMeta(null)
                setError(null)
                setState("upload")
              }}
            >
              <RotateCcw className="size-4 text-[#666666]" />
            </button>
          </div>

          {result.observanceAlert ? (
            <p className="mt-5 rounded-2xl border border-[#B8860B]/20 bg-[#FFF8E1] p-4 text-sm leading-6 text-[#7A5B08]">
              {result.observanceAlert}
            </p>
          ) : null}

          {/* Diners Configuration Panel */}
          <div className="mt-5 rounded-2xl border border-[#E8E3DC] bg-white p-5 shadow-sm">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#C17A2E] uppercase tracking-wider">
              <Users className="size-3.5" /> Who is dining?
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition ${
                  selectedParty.includes("me")
                    ? "border-[#C17A2E] bg-[#FFF8E1] text-[#1A1A1A]"
                    : "border-[#E8E3DC] bg-white text-[#666666]"
                }`}
                onClick={() => togglePartyMember("me")}
              >
                {selectedParty.includes("me") && <Check className="size-3 text-[#C17A2E]" />}
                Me
              </button>
              {familyProfiles.map((member) => (
                <button
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition ${
                    selectedParty.includes(member.id)
                      ? "border-[#C17A2E] bg-[#FFF8E1] text-[#1A1A1A]"
                      : "border-[#E8E3DC] bg-white text-[#666666]"
                  }`}
                  key={member.id}
                  onClick={() => togglePartyMember(member.id)}
                >
                  {selectedParty.includes(member.id) && <Check className="size-3 text-[#C17A2E]" />}
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          {/* Social Dining Compatibility Score dial */}
          {selectedParty.length > 1 && (
            <div className="mt-4 rounded-2xl border border-[#C17A2E]/20 bg-[#FFF8E1]/30 p-5 shadow-sm flex items-center gap-5">
              <div className="relative flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-[#C17A2E] bg-white font-mono text-xl font-bold text-[#C17A2E]">
                {partyCompatibility.score}%
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold text-[#1A1A1A]">Dining Compatibility</h3>
                <p className="mt-1 text-xs text-[#666666]">
                  {partyCompatibility.universalSafeDishes.length} dishes are safe for every diner in your party.
                </p>
              </div>
            </div>
          )}

          {/* Tab Toggles for List View vs OCR Visual Map */}
          <div className="mt-5 flex gap-2">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition ${
                viewMode === "list"
                  ? "border-[#C17A2E] bg-[#FFF8E1] text-[#C17A2E]"
                  : "border-[#E8E3DC] bg-white text-[#666666]"
              }`}
              onClick={() => setViewMode("list")}
            >
              <List className="size-3.5" />
              Detailed List
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition ${
                viewMode === "visual"
                  ? "border-[#C17A2E] bg-[#FFF8E1] text-[#C17A2E]"
                  : "border-[#E8E3DC] bg-white text-[#666666]"
              }`}
              onClick={() => setViewMode("visual")}
            >
              <Map className="size-3.5" />
              Visual Map (OCR)
            </button>
          </div>

          {/* Presenter Views */}
          <AnimatePresence mode="wait">
            {viewMode === "visual" ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 relative overflow-hidden rounded-2xl border border-[#E8E3DC] bg-[#F5F0E8] p-3 shadow-md min-h-[300px] flex items-center justify-center"
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: 10 }}
                key="visual-view"
              >
                <div className="relative w-full max-w-sm aspect-[3/4]">
                  {preview ? (
                    <Image
                      alt="Menu visual mapping"
                      className="rounded-xl object-cover opacity-80"
                      fill
                      src={preview}
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-white border border-[#E8E3DC] flex flex-col items-center justify-center p-6 text-center">
                      <ScanLine className="size-10 text-[#C17A2E] animate-pulse" />
                      <p className="mt-3 text-xs font-semibold text-[#666666]">Simulated Visual Menu Map</p>
                    </div>
                  )}
                  {/* Absolute OCR overlays */}
                  {ocrBoundingBoxes.map((box, i) => (
                    <button
                      className={cn(
                        "absolute rounded border-2 shadow-sm animate-pulse-slow transition cursor-pointer flex items-center justify-center text-[10px] font-bold text-white uppercase",
                        box.status === "safe" && "border-[#2E7D5B] bg-[#2E7D5B]/30",
                        box.status === "warning" && "border-[#B8860B] bg-[#B8860B]/30",
                        box.status === "violation" && "border-[#C0392B] bg-[#C0392B]/30",
                        box.status === "uncertain" && "border-[#888888] bg-[#888888]/30"
                      )}
                      key={`${box.name}-${i}`}
                      onClick={() => scrollToDishCard(box.name)}
                      style={{
                        top: box.coords.top,
                        left: box.coords.left,
                        width: box.coords.width,
                        height: box.coords.height
                      }}
                    >
                      {box.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                animate={{ opacity: 1 }}
                className="mt-5 space-y-4"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key="list-view"
              >
                {/* Chef Card trigger */}
                <div className="mb-2">
                  <Button
                    className="min-h-12 w-full rounded-2xl bg-white border border-[#E8E3DC] text-[#1A1A1A] font-semibold flex items-center justify-center gap-2 hover:bg-[#FAFAF7] shadow-sm"
                    onClick={() => setShowKitchenModal(true)}
                  >
                    <Languages className="size-4 text-[#C17A2E]" />
                    Generate Combined Chef Card
                  </Button>
                </div>

                {/* Score Counter Summary */}
                <div className="grid grid-cols-4 gap-2 rounded-2xl border border-[#E8E3DC] bg-white p-3 text-center shadow-sm">
                  {[
                    ["Safe", result.safeCount, "#2E7D5B"],
                    ["Warn", result.warningCount, "#B8860B"],
                    ["Avoid", result.violationCount, "#C0392B"],
                    ["Ask", result.uncertainCount, "#888888"]
                  ].map(([label, count, color]) => (
                    <div key={label}>
                      <p className="font-mono text-lg font-semibold" style={{ color: String(color) }}>
                        {count}
                      </p>
                      <p className="text-[11px] text-[#666666]">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Filter chips */}
                <div className="flex flex-wrap gap-2 py-1">
                  {filters.map((item) => (
                    <button
                      className={cn(
                        "min-h-10 shrink-0 rounded-full border px-4 text-xs font-medium capitalize transition",
                        filter === item
                          ? "border-[#C17A2E] bg-[#C17A2E] text-white"
                          : "border-[#E8E3DC] bg-white text-[#1A1A1A]"
                      )}
                      key={item}
                      onClick={() => setFilter(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                {/* Dishes list */}
                <motion.div animate="show" className="grid gap-4" initial="hidden" variants={container}>
                  {visibleDishes.map((dish, i) => {
                    const origIndex = result.dishes.findIndex((d) => d.name === dish.name)
                    const familyCompliances = origIndex !== -1 ? getFamilyCompliancesForDish(origIndex) : []

                    return (
                      <motion.div id={`dish-${dish.name.replace(/\s+/g, "-")}`} key={`${dish.name}-${i}`} variants={item}>
                        <DishCard dish={dish} familyCompliances={familyCompliances} />
                      </motion.div>
                    )
                  })}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Menu Chat Panel */}
          <MenuChatPanel profile={combinedProfile} result={result} />

          <div className="mt-5">
            <KitSuggestion tradition={combinedProfile.tradition as Tradition} />
          </div>

          {/* Combined Chef Card Modal */}
          <KitchenCardModal
            onOpenChange={setShowKitchenModal}
            open={showKitchenModal}
            profile={combinedProfile}
          />
        </section>
      ) : null}

      <BottomNav />
    </main>
  )
}
