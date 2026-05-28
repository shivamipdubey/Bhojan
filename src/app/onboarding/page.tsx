"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { strictnessLabels, traditionSubTraditions } from "@/lib/profile"
import { TRADITION_DESCRIPTIONS, TRADITION_LABELS, type Strictness, type Tradition } from "@/types"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { KeyboardEvent, useState } from "react"

const traditions = Object.keys(TRADITION_LABELS) as Tradition[]
const allergyOptions = ["Nuts", "Dairy", "Gluten", "Soy", "Shellfish", "Sesame", "Other"]

const variants = {
  enter: { x: 40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -40, opacity: 0 }
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [tradition, setTradition] = useState<Tradition | null>(null)
  const [subTradition, setSubTradition] = useState<string | null>(null)
  const [strictness, setStrictness] = useState<Strictness>("standard")
  const [allergies, setAllergies] = useState<string[]>([])
  const [dislikes, setDislikes] = useState<string[]>([])
  const [dislikeInput, setDislikeInput] = useState("")
  const [loading, setLoading] = useState(false)

  const toggleAllergy = (allergy: string) => {
    setAllergies((current) =>
      current.includes(allergy) ? current.filter((item) => item !== allergy) : [...current, allergy]
    )
  }

  const addDislike = () => {
    const value = dislikeInput.trim().replace(/,$/, "")
    if (!value) return
    setDislikes((current) => (current.includes(value) ? current : [...current, value]))
    setDislikeInput("")
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      addDislike()
    }
  }

  const complete = async () => {
    if (!tradition) return
    setLoading(true)

    const profile = { tradition, subTradition, strictness, allergies, dislikes }
    window.localStorage.setItem("bhojan-profile", JSON.stringify(profile))

    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    })

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((item) => (
          <div className="h-2 flex-1 rounded-full bg-[#E8E3DC]" key={item}>
            <motion.div
              animate={{ width: item <= step ? "100%" : "0%" }}
              className="h-full rounded-full bg-[#C17A2E]"
              transition={{ duration: 0.2 }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.section
            animate="center"
            className="rounded-2xl border border-[#E8E3DC] bg-white p-6 shadow-sm"
            exit="exit"
            initial="enter"
            key="welcome"
            transition={{ duration: 0.2 }}
            variants={variants}
          >
            <h1 className="font-heading text-[32px] font-semibold text-[#C17A2E]">Bhojan</h1>
            <p className="mt-4 text-lg font-medium text-[#1A1A1A]">Your practice. Your plate.</p>
            <p className="mt-3 text-sm leading-6 text-[#666666]">
              Set up once. Know what you can eat anywhere in the world.
            </p>
            <Button
              className="mt-8 min-h-12 w-full rounded-full bg-[#C17A2E] text-white hover:bg-[#A66520]"
              onClick={() => setStep(2)}
            >
              Get Started
            </Button>
          </motion.section>
        ) : null}

        {step === 2 ? (
          <motion.section
            animate="center"
            exit="exit"
            initial="enter"
            key="tradition"
            transition={{ duration: 0.2 }}
            variants={variants}
          >
            <h1 className="font-heading text-3xl font-semibold text-[#1A1A1A]">What is your practice?</h1>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {traditions.map((item) => (
                <button
                  className={cn(
                    "min-h-36 rounded-2xl border bg-white p-4 text-left transition",
                    tradition === item
                      ? "border-2 border-[#C17A2E] bg-[#FFF8E1]"
                      : "border-[#E8E3DC]"
                  )}
                  key={item}
                  onClick={() => {
                    setTradition(item)
                    setSubTradition(traditionSubTraditions[item][0] ?? null)
                  }}
                >
                  <p className="text-sm font-semibold text-[#1A1A1A]">{TRADITION_LABELS[item]}</p>
                  <p className="mt-2 text-xs leading-5 text-[#666666]">{TRADITION_DESCRIPTIONS[item]}</p>
                </button>
              ))}
            </div>
            <Button
              className="mt-6 min-h-12 w-full rounded-full bg-[#C17A2E] text-white hover:bg-[#A66520]"
              disabled={!tradition}
              onClick={() => setStep(3)}
            >
              Continue
            </Button>
          </motion.section>
        ) : null}

        {step === 3 ? (
          <motion.section
            animate="center"
            className="rounded-2xl border border-[#E8E3DC] bg-white p-6 shadow-sm"
            exit="exit"
            initial="enter"
            key="personalize"
            transition={{ duration: 0.2 }}
            variants={variants}
          >
            <h1 className="font-heading text-3xl font-semibold text-[#1A1A1A]">Personalize</h1>

            {tradition ? (
              <>
                <h2 className="mt-8 text-sm font-semibold text-[#1A1A1A]">Sub-tradition</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {traditionSubTraditions[tradition].map((item) => (
                    <button
                      className={cn(
                        "min-h-11 rounded-full border px-4 text-sm font-medium",
                        subTradition === item
                          ? "border-[#C17A2E] bg-[#C17A2E] text-white"
                          : "border-[#E8E3DC] bg-white text-[#1A1A1A]"
                      )}
                      key={item}
                      onClick={() => setSubTradition(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <h2 className="mt-8 text-sm font-semibold text-[#1A1A1A]">Strictness</h2>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(Object.keys(strictnessLabels) as Strictness[]).map((item) => (
                    <button
                      className={cn(
                        "min-h-11 rounded-xl border px-2 text-xs font-medium",
                        strictness === item
                          ? "border-[#C17A2E] bg-[#FFF8E1] text-[#1A1A1A]"
                          : "border-[#E8E3DC] bg-white text-[#666666]"
                      )}
                      key={item}
                      onClick={() => setStrictness(item)}
                    >
                      {strictnessLabels[item]}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            <h2 className="mt-8 text-sm font-semibold text-[#1A1A1A]">Food allergies</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {allergyOptions.map((allergy) => (
                <button
                  className={cn(
                    "min-h-11 rounded-full border px-4 text-sm font-medium",
                    allergies.includes(allergy)
                      ? "border-[#C17A2E] bg-[#C17A2E] text-white"
                      : "border-[#E8E3DC] bg-white text-[#1A1A1A]"
                  )}
                  key={allergy}
                  onClick={() => toggleAllergy(allergy)}
                >
                  {allergy}
                </button>
              ))}
            </div>

            <h2 className="mt-8 text-sm font-semibold text-[#1A1A1A]">I also don&apos;t eat</h2>
            <Input
              className="mt-3 min-h-11 rounded-xl border-[#E8E3DC] bg-white"
              onBlur={addDislike}
              onChange={(event) => setDislikeInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Coffee, eggplant, extra spicy..."
              value={dislikeInput}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {dislikes.map((item) => (
                <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#F5F0E8] px-3 text-sm" key={item}>
                  {item}
                  <button
                    aria-label={`Remove ${item}`}
                    className="text-[#666666]"
                    onClick={() => setDislikes((current) => current.filter((value) => value !== item))}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>

            <Button
              className="mt-8 min-h-12 w-full rounded-full bg-[#C17A2E] text-white hover:bg-[#A66520]"
              disabled={loading}
              onClick={complete}
            >
              {loading ? "Saving..." : "Complete Setup"}
            </Button>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </main>
  )
}
