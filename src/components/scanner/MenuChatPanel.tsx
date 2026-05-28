"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type PracticeProfile } from "@/lib/profile"
import { type ScanResult } from "@/types"
import { MessageSquare, Send, User, Bot, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface Message {
  role: "user" | "assistant"
  content: string
}

const QUICK_SUGGESTIONS = [
  "Can I customize any pasta to be compliant?",
  "Are there eggless desserts on this menu?",
  "Is the Margherita pizza safe to eat?",
  "What questions should I ask the chef?"
]

export function MenuChatPanel({
  result,
  profile
}: {
  result: ScanResult
  profile: PracticeProfile
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi! I have reviewed the menu for **${result.restaurant || "this restaurant"}** against your **${profile.tradition}** profile. 
      
Ask me how to customize any dish, double-check safe options, or click the **Generate Kitchen Card** button to translate your needs for the chef!`
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMessage: Message = { role: "user", content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputValue("")
    setLoading(true)

    // Serialize menu context for the API
    const serializedDishes = result.dishes
      .map(
        (d) =>
          `- ${d.name}: Status is ${d.status.toUpperCase()} (${Math.round(
            d.confidence * 100
          )}% confidence). Violations: ${d.violations.join(", ") || "None"}. Hidden risk: ${
            d.hiddenRisk || "None"
          }. Alternatives: ${d.alternatives.join(", ") || "None"}.`
      )
      .join("\n")

    const menuContext = `Restaurant: ${result.restaurant || "Bella Italia"}\nDishes analyzed:\n${serializedDishes}`

    try {
      const response = await fetch("/api/chat-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          menuContext,
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()
      if (data.response) {
        setMessages((current) => [
          ...current,
          { role: "assistant", content: data.response }
        ])
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Sorry, I had trouble parsing the menu context. Please try again."
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-[#E8E3DC] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-[#E8E3DC]/40 pb-3">
        <MessageSquare className="size-5 text-[#C17A2E]" />
        <h2 className="font-heading text-lg font-medium text-[#1A1A1A]">
          Ask Bhojan AI
        </h2>
      </div>

      {/* Message Feed */}
      <div className="mt-4 max-h-72 overflow-y-auto space-y-3 pr-1">
        {messages.map((m, idx) => {
          const isUser = m.role === "user"

          return (
            <div
              className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              key={idx}
            >
              {/* Avatar circle */}
              <div
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isUser ? "bg-[#C17A2E] text-white" : "bg-[#F5F0E8] text-[#C17A2E]"
                }`}
              >
                {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-2.5 text-xs leading-5 max-w-[80%] whitespace-pre-line ${
                  isUser
                    ? "bg-[#C17A2E] text-white rounded-tr-none"
                    : "bg-[#FAFAF7] text-[#1A1A1A] border border-[#E8E3DC]/40 rounded-tl-none"
                }`}
              >
                {m.content}
              </div>
            </div>
          )
        })}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F5F0E8] text-[#C17A2E]">
              <Bot className="size-3.5 animate-spin" />
            </div>
            <div className="rounded-2xl rounded-tl-none bg-[#FAFAF7] border border-[#E8E3DC]/40 px-4 py-2 text-xs text-[#666666] flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin text-[#C17A2E]" />
              Thinking...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {QUICK_SUGGESTIONS.map((sug) => (
          <button
            className="shrink-0 rounded-full border border-[#E8E3DC] bg-[#FAFAF7] px-3.5 py-1.5 text-[10px] font-medium text-[#1A1A1A] hover:border-[#C17A2E] hover:bg-[#FFF8E1] transition"
            key={sug}
            onClick={() => handleSendMessage(sug)}
            type="button"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* "Bring it Home" Recipe Generator */}
      <div className="mt-4 border-t border-[#E8E3DC]/40 pt-3">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666]" htmlFor="dish-select">
          🍳 Bring it Home (Compliant Recipe Creator)
        </label>
        <div className="mt-2 flex gap-2">
          <select
            className="flex-1 min-h-10 rounded-xl border border-[#E8E3DC] bg-[#FAFAF7] px-3 text-xs text-[#1A1A1A] outline-none cursor-pointer hover:border-[#C17A2E]/50"
            id="dish-select"
            onChange={(e) => {
              if (e.target.value) {
                handleSendMessage(`Provide a 100% compliant home-cooking recipe for "${e.target.value}" that respects my practice rules. List any safe substitutes for restricted ingredients and give brief cooking steps.`)
                e.target.value = "" // Reset
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>Select a dish to recreate at home...</option>
            {result.dishes.map((dish) => (
              <option key={dish.name} value={dish.name}>
                🍳 {dish.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat input box */}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage(inputValue)
        }}
      >
        <Input
          className="min-h-10 flex-1 rounded-xl border-[#E8E3DC] bg-white text-xs"
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a modification question..."
          value={inputValue}
        />
        <Button
          className="size-10 shrink-0 rounded-xl bg-[#C17A2E] text-white hover:bg-[#A66520] flex items-center justify-center p-0"
          disabled={!inputValue.trim() || loading}
          type="submit"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </section>
  )
}
