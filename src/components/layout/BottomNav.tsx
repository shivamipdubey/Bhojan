"use client"

import { cn } from "@/lib/utils"
import { CalendarDays, History, Home, ScanLine, UserRound } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/scan", label: "Scan", icon: ScanLine },
  { href: "/history", label: "History", icon: History },
  { href: "/observance", label: "Observance", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: UserRound }
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E8E3DC] bg-white px-4 py-3 shadow-[0_-4px_18px_rgba(0,0,0,0.04)]">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href

          return (
            <Link
              className={cn(
                "flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium text-[#666666] transition",
                active && "text-[#C17A2E]"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
