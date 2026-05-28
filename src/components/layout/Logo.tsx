"use client"

import { ShieldAlert } from "lucide-react"
import Link from "next/link"

export function Logo({ 
  className = "", 
  textClassName = "text-[#1A1A1A] group-hover:text-[#C17A2E]" 
}: { 
  className?: string
  textClassName?: string
}) {
  return (
    <Link className={`flex items-center gap-2 group ${className}`} href="/">
      {/* Visual Logo SVG Icon */}
      <div className="flex size-9 items-center justify-center rounded-xl bg-[#C17A2E] text-white shadow-sm group-hover:scale-105 transition duration-200">
        <ShieldAlert className="size-5" />
      </div>
      
      {/* Brand Text */}
      <span className={`font-heading text-xl font-bold tracking-tight transition duration-200 ${textClassName}`}>
        Bhojan
      </span>
    </Link>
  )
}
