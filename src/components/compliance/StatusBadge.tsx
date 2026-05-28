"use client"

import { STATUS_STYLES, type ComplianceStatus } from "@/types"
import { motion } from "framer-motion"

export function StatusBadge({ status }: { status: ComplianceStatus }) {
  const style = STATUS_STYLES[status]

  return (
    <motion.span
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex rounded-full px-3 py-1 text-xs font-medium"
      initial={{ scale: 0.8, opacity: 0 }}
      style={{ backgroundColor: style.bg, color: style.text }}
      transition={{ duration: 0.15, delay: 0.1 }}
    >
      {style.label}
    </motion.span>
  )
}
