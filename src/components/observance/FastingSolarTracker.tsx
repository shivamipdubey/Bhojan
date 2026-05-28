"use client"

import { getSolarTimes } from "@/lib/solar"
import { type Tradition } from "@/types"
import { motion } from "framer-motion"
import { Sun, Moon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

// Default mock coordinates for fallbacks (Varanasi, India)
const DEFAULT_COORDS = { latitude: 25.3176, longitude: 82.9739, label: "Varanasi, India" }

const CURATED_CITIES = [
  { name: "Varanasi, India", lat: 25.3176, lng: 82.9739 },
  { name: "Mecca, Saudi Arabia", lat: 21.3891, lng: 39.8579 },
  { name: "Jerusalem, Israel", lat: 31.7683, lng: 35.2137 },
  { name: "Amritsar, India", lat: 31.6340, lng: 74.8723 },
  { name: "Rome, Italy", lat: 41.9028, lng: 12.4964 },
  { name: "Salt Lake City, USA", lat: 40.7608, lng: -111.8910 }
]

export function FastingSolarTracker() {
  const [coords, setCoords] = useState(DEFAULT_COORDS)
  const [tradition] = useState<Tradition>(() => {
    if (typeof window === "undefined") return "satvik"
    const saved = window.localStorage.getItem("bhojan-profile")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.tradition) return parsed.tradition as Tradition
      } catch {
        // Fallback to satvik
      }
    }
    return "satvik"
  })
  const [currentTime, setCurrentTime] = useState(() => new Date())

  // 1. Detect active geolocation and start timer on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            label: "Detected Location"
          })
        },
        () => {
          // Silent fallback to Varanasi
        }
      )
    }

    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // 2. Purely compute solar times and tracking variables during rendering
  const solarTimes = useMemo(() => {
    return getSolarTimes(currentTime, coords.latitude, coords.longitude)
  }, [currentTime, coords])

  const { timerLabel, timerText, sunProgress } = useMemo(() => {
    const now = currentTime.getTime()
    const sunrise = solarTimes.sunrise.getTime()
    const sunset = solarTimes.sunset.getTime()
    const fajr = solarTimes.fajr.getTime()

    const formatDiff = (diffMs: number) => {
      const hours = Math.floor(diffMs / (3600 * 1000))
      const minutes = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000))
      const seconds = Math.floor((diffMs % (60 * 1000)) / 1000)
      return `${hours}h ${minutes}m ${seconds}s`
    }

    let diff = 0
    let label = ""
    let sunProgressVal = 0.5

    if (tradition === "halal") {
      if (now >= fajr && now < sunset) {
        diff = sunset - now
        label = "🌙 Ramadan Fasting • Sun Sets In"
      } else {
        const targetFajr = now >= sunset ? fajr + 24 * 3600 * 1000 : fajr
        diff = targetFajr - now
        label = "☀️ Eating Window Open • Next Fast In"
      }
    } else if (tradition === "satvik" || tradition === "jain") {
      if (now >= sunrise && now < sunset) {
        diff = sunset - now
        label = "☀️ Daylight Eating Window • Sunset In"
      } else {
        const targetSunrise = now >= sunset ? sunrise + 24 * 3600 * 1000 : sunrise
        diff = targetSunrise - now
        label = "🌙 Fasting (No Night Eating) • Sunrise In"
      }
    } else {
      if (now >= sunrise && now < sunset) {
        diff = sunset - now
        label = "☀️ Fast Active • Sunset In"
      } else {
        const targetSunrise = now >= sunset ? sunrise + 24 * 3600 * 1000 : sunrise
        diff = targetSunrise - now
        label = "🌙 Fast Completed • Next Day Starts In"
      }
    }

    const displayTimer = formatDiff(diff)

    if (now >= sunrise && now < sunset) {
      const dayLength = sunset - sunrise
      const elapsed = now - sunrise
      sunProgressVal = elapsed / dayLength
    } else if (now >= sunset) {
      sunProgressVal = 1
    } else {
      sunProgressVal = 0
    }

    return {
      timerLabel: label,
      timerText: displayTimer,
      sunProgress: sunProgressVal
    }
  }, [currentTime, solarTimes, tradition])

  // Coordinates for the visual Sun node on the SVG arc:
  const angle = Math.PI - sunProgress * Math.PI
  const sunX = 50 + 40 * Math.cos(angle) // SVG scale is 100x50
  const sunY = 45 - 35 * Math.sin(angle)

  const isNight = currentTime.getTime() < solarTimes.sunrise.getTime() || currentTime.getTime() >= solarTimes.sunset.getTime()

  return (
    <article className="relative overflow-hidden rounded-3xl border border-[#E8E3DC] bg-white p-6 shadow-sm">
      {/* Background radial glow */}
      <div className="absolute -right-20 -top-20 size-44 rounded-full bg-[#FFF8E1] opacity-50 blur-2xl" />

      <div className="flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#C17A2E]">
            {tradition === "satvik" || tradition === "jain" ? "Daylight Rhythm" : "Fasting Tracker"}
          </span>
          <h2 className="mt-1 font-heading text-xl font-semibold text-[#1A1A1A]">
            Solar Observance
          </h2>
        </div>
        <div className="relative">
          <select
            className="flex items-center gap-1 rounded-full border border-[#E8E3DC] bg-[#FAFAF7] px-3 py-1 text-xs text-[#666666] outline-none cursor-pointer hover:bg-[#FAFAF7]/80"
            onChange={(e) => {
              if (e.target.value === "gps") {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setCoords({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        label: "Detected Location"
                      })
                    }
                  )
                }
              } else {
                const city = CURATED_CITIES.find(c => c.name === e.target.value)
                if (city) {
                  setCoords({
                    latitude: city.lat,
                    longitude: city.lng,
                    label: city.name
                  })
                }
              }
            }}
            value={coords.label === "Detected Location" ? "gps" : coords.label}
          >
            <option value="gps">📡 GPS Active</option>
            {CURATED_CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                📍 {c.name.split(",")[0]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Sun Path Graphic */}
      <div className="relative mt-6 h-28 w-full border-b border-[#E8E3DC]/80">
        <svg className="h-full w-full" viewBox="0 0 100 50">
          <defs>
            <linearGradient id="solar-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#E8E3DC" />
              <stop offset="50%" stopColor="#C17A2E" />
              <stop offset="100%" stopColor="#E8E3DC" />
            </linearGradient>
          </defs>
          
          {/* Arch path */}
          <path
            className="stroke-[1.5]"
            d="M 10,45 A 40,35 0 0,1 90,45"
            fill="none"
            stroke="url(#solar-gradient)"
            strokeDasharray="2 2"
          />

          {/* Sunrise/Sunset Markers */}
          <circle cx="10" cy="45" fill="#4A6741" r="1.5" />
          <circle cx="90" cy="45" fill="#C0392B" r="1.5" />

          {/* Animated Sun Position */}
          {!isNight ? (
            <g>
              <motion.circle
                animate={{ r: [3.5, 4.5, 3.5] }}
                cx={sunX}
                cy={sunY}
                fill="#FFF8E1"
                opacity={0.6}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <circle cx={sunX} cy={sunY} fill="#C17A2E" r="2" />
            </g>
          ) : null}
        </svg>

        {/* Sunrise/Sunset Labels */}
        <div className="absolute bottom-1 left-2 text-[10px] font-medium text-[#666666]">
          {solarTimes.sunrise.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          <p className="text-[9px] text-[#999999]">Sunrise</p>
        </div>
        <div className="absolute bottom-1 right-2 text-right text-[10px] font-medium text-[#666666]">
          {solarTimes.sunset.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          <p className="text-[9px] text-[#999999]">Sunset</p>
        </div>

        {/* Center state overlay */}
        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center">
          {isNight ? (
            <div className="flex size-10 items-center justify-center rounded-full bg-[#FAFAF7] border border-[#E8E3DC]">
              <Moon className="size-5 text-[#888888]" />
            </div>
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-[#FFF8E1] border border-[#C17A2E]/20">
              <Sun className="size-5 text-[#C17A2E]" />
            </div>
          )}
        </div>
      </div>

      {/* Solar Timers and Warnings */}
      <div className="mt-5 rounded-2xl bg-[#FAFAF7] p-4 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
          {timerLabel}
        </p>
        <p className="mt-1.5 font-mono text-xl font-bold tracking-tight text-[#1A1A1A]">
          {timerText}
        </p>
        <div className="mt-3 flex justify-center gap-4 border-t border-[#E8E3DC]/40 pt-3 text-[11px] text-[#666666]">
          <div>
            <span className="font-semibold text-[#1A1A1A]">Dawn (Fajr):</span>{" "}
            {solarTimes.fajr.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="h-3 w-px bg-[#E8E3DC]" />
          <div>
            <span className="font-semibold text-[#1A1A1A]">Dusk (Maghrib):</span>{" "}
            {solarTimes.maghrib.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    </article>
  )
}
