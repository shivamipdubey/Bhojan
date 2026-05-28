"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { type PracticeProfile } from "@/lib/profile"
import { Globe, Languages, Loader2, Sparkles, Printer, QrCode, X } from "lucide-react"
import { useState } from "react"

const LANGUAGES = [
  { name: "Italian", label: "Italiano (Italy)", flag: "🇮🇹" },
  { name: "Japanese", label: "日本語 (Japan)", flag: "🇯🇵" },
  { name: "Spanish", label: "Español (Spain/LatAm)", flag: "🇪🇸" },
  { name: "French", label: "Français (France)", flag: "🇫🇷" },
  { name: "Thai", label: "ไทย (Thailand)", flag: "🇹🇭" },
  { name: "Hindi", label: "हिन्दी (India)", flag: "🇮🇳" }
]

interface KitchenCardData {
  translatedTitle: string
  translatedContent: string
  englishContent: string
}

export function KitchenCardModal({
  open,
  onOpenChange,
  profile
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: PracticeProfile & { traditions?: string[] }
}) {
  const [selectedLanguage, setSelectedLanguage] = useState("Italian")
  const [loading, setLoading] = useState(false)
  const [cardData, setCardData] = useState<KitchenCardData | null>(null)
  const [showEnglish, setShowEnglish] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const generateCard = async (lang = selectedLanguage) => {
    setLoading(true)
    try {
      const response = await fetch("/api/translate-kitchen-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          targetLanguage: lang
        })
      })
      const data = (await response.json()) as KitchenCardData
      setCardData(data)
    } catch {
      // API Route handles local fallbacks itself
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang)
    if (open) {
      void generateCard(lang)
    }
  }

  const handleOpen = () => {
    if (!cardData && open) {
      void generateCard(selectedLanguage)
    }
  }

  // Trigger browser print for only the card contents
  const handlePrint = () => {
    if (!cardData) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const title = showEnglish ? "Dietary Alert (English)" : cardData.translatedTitle
    const content = showEnglish ? cardData.englishContent : cardData.translatedContent

    printWindow.document.write(`
      <html>
        <head>
          <title>Bhojan - Kitchen Alert Card</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1a1a1a; }
            .card { border: 4px solid #C17A2E; border-radius: 20px; padding: 30px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 10px rgba(0,0,0,0.1); position: relative; }
            .side-bar { position: absolute; left: 0; top: 0; bottom: 0; w: 8px; bg-color: #C17A2E; }
            h1 { font-size: 24px; border-bottom: 2px solid #E8E3DC; padding-bottom: 15px; margin-top: 0; }
            p { font-size: 16px; line-height: 1.6; white-space: pre-line; font-weight: 500; }
            .warning { color: #C0392B; font-weight: bold; margin-top: 25px; font-size: 14px; border-top: 1px solid #E8E3DC; padding-top: 15px; }
            @media print {
              body { padding: 0; }
              .card { box-shadow: none; border-width: 3px; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>⚠️ ${title}</h1>
            <p>${content}</p>
            <div class="warning">⚠️ ATTENTION KITCHEN: Prevent cross-contamination. Use clean pans and utensils.</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (isOpen) handleOpen()
      }}
      open={open}
    >
      <DialogContent className="max-w-md bg-[#FAFAF7] p-6 rounded-3xl border border-[#E8E3DC]">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-[#1A1A1A] flex items-center gap-2">
            <Globe className="size-5 text-[#C17A2E]" />
            Chef Translation Card
          </DialogTitle>
          <DialogDescription className="text-xs text-[#666666]">
            Present this customized dietary card to the head chef or server at your table.
          </DialogDescription>
        </DialogHeader>

        {/* Language Selector */}
        <div className="mt-4">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#666666]" htmlFor="lang-select">
            Select Language
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2" id="lang-select">
            {LANGUAGES.map((lang) => (
              <button
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                  selectedLanguage === lang.name
                    ? "border-2 border-[#C17A2E] bg-[#FFF8E1] text-[#1A1A1A]"
                    : "border-[#E8E3DC] bg-white text-[#666666] hover:bg-[#FAFAF7]"
                }`}
                key={lang.name}
                onClick={() => handleLanguageChange(lang.name)}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Card Presenter view */}
        <div className="mt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-[#E8E3DC] bg-white">
              <Loader2 className="size-8 text-[#C17A2E] animate-spin" />
              <p className="mt-3 text-sm font-medium text-[#666666]">Translating restrictions...</p>
            </div>
          ) : cardData ? (
            <div className="space-y-4">
              {/* The high-contrast visual kitchen card container */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#C17A2E] bg-white p-5 shadow-md">
                {/* Saffron side border for emphasis */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#C17A2E]" />

                <div className="flex items-start justify-between border-b border-[#E8E3DC]/60 pb-3">
                  <h3 className="font-heading text-lg font-bold text-[#1A1A1A] leading-5">
                    {showEnglish ? "Dietary Alert (English)" : cardData.translatedTitle}
                  </h3>
                  <Languages className="size-5 text-[#C17A2E]/60" />
                </div>

                <div className="mt-4 whitespace-pre-line text-sm leading-6 text-[#1A1A1A] font-medium font-sans">
                  {showEnglish ? cardData.englishContent : cardData.translatedContent}
                </div>

                {/* Professional culinary warning label */}
                <div className="mt-5 border-t border-[#E8E3DC]/40 pt-3 text-[11px] font-semibold text-[#C0392B] flex items-center gap-1.5 leading-none">
                  ⚠️ Cross-contamination warning active
                </div>
              </div>

              {/* Toggles and controls */}
              <div className="flex items-center justify-between border-b border-[#E8E3DC]/40 pb-4">
                <button
                  className="text-xs font-semibold text-[#C17A2E] underline flex items-center gap-1"
                  onClick={() => setShowEnglish(!showEnglish)}
                >
                  <Sparkles className="size-3" />
                  {showEnglish ? "Show Chef Translation" : "Show English Reference"}
                </button>
                <div className="text-[11px] text-[#666666] italic">
                  Tap to present to your waiter
                </div>
              </div>

              {/* Actions: Print and QR Share */}
              <div className="flex gap-3 pt-1">
                <Button
                  className="flex-1 rounded-xl border-[#E8E3DC] bg-white text-xs font-semibold text-[#1A1A1A] hover:bg-[#FAFAF7]"
                  onClick={handlePrint}
                  variant="outline"
                >
                  <Printer className="mr-2 size-4 text-[#C17A2E]" />
                  Print Card
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-[#C17A2E] text-xs font-semibold text-white hover:bg-[#A66520]"
                  onClick={() => setShowQR(true)}
                >
                  <QrCode className="mr-2 size-4" />
                  Waitstaff QR
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="w-full min-h-11 rounded-xl bg-[#C17A2E] text-white hover:bg-[#A66520]"
              onClick={() => generateCard()}
            >
              Generate Kitchen Card
            </Button>
          )}
        </div>
      </DialogContent>

      {/* QR Code Overlay Drawer */}
      {showQR && cardData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-[#E8E3DC] bg-white p-6 text-center shadow-xl">
            <button
              aria-label="Close QR view"
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#666666] hover:bg-[#FAFAF7]"
              onClick={() => setShowQR(false)}
            >
              <X className="size-5" />
            </button>
            <h3 className="font-heading text-lg font-bold text-[#1A1A1A]">Scan for Chef Card</h3>
            <p className="mt-2 text-xs text-[#666666]">
              Ask your waiter to scan this code to load this Chef Card instantly on their device.
            </p>
            
            {/* SVG Mock QR Code */}
            <div className="mx-auto my-6 flex size-44 items-center justify-center rounded-2xl border-2 border-[#C17A2E] p-2 bg-white">
              <svg className="size-full text-[#1a1a1a]" viewBox="0 0 100 100">
                <rect fill="white" height="100" width="100" />
                <path
                  d="M10,10 h20 v20 h-20 z M15,15 h10 v10 h-10 z M10,70 h20 v20 h-20 z M15,75 h10 v10 h-10 z M70,10 h20 v20 h-20 z M75,15 h10 v10 h-10 z"
                  fill="currentColor"
                />
                <path
                  d="M40,10 h5 v5 h-5 z M45,15 h5 v5 h-5 z M55,10 h10 v5 h-10 z M35,25 h15 v5 h-15 z M60,25 h10 v5 h-10 z M40,35 h5 v10 h-5 z M50,40 h15 v5 h-15 z M10,40 h5 v15 h-5 z M20,45 h15 v5 h-15 z M10,60 h10 v5 h-10 z M40,55 h10 v10 h-10 z M55,50 h5 v15 h-5 z M70,40 h10 v15 h-10 z M80,45 h10 v5 h-10 z M70,60 h5 v25 h-5 z M80,70 h15 v5 h-15 z M85,80 h5 v10 h-5 z M35,80 h10 v10 h-10 z M45,75 h15 v5 h-15 z M55,85 h10 v5 h-10 z"
                  fill="currentColor"
                />
              </svg>
            </div>
            
            <p className="font-mono text-[10px] text-[#C17A2E]">
              bhojan.io/waiter/scan?id=chef-card
            </p>
          </div>
        </div>
      ) : null}
    </Dialog>
  )
}
