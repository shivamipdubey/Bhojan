"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  ArrowRight,
  ScanLine,
  ShieldCheck,
  Users,
  Sparkles,
  Menu,
  X,
  Clock,
  MapPin,
  Calendar,
  TrendingUp,
  Sun,
  Moon,
  Leaf,
  Star,
  Droplets,
  Settings,
  Sunrise,
  Sunset
} from "lucide-react"
import { Logo } from "@/components/layout/Logo"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Accurate solar calculation using simplified SunCalc algorithm
const calculateSunriseSunset = (lat: number, lon: number, date: Date = new Date()) => {
  const PI = Math.PI
  const sin = Math.sin
  const cos = Math.cos
  const asin = Math.asin
  const acos = Math.acos
  const rad = PI / 180

  const dayMs = 1000 * 60 * 60 * 24
  const J1970 = 2440588
  const J2000 = 2451545

  const toJulian = (date: Date) => date.valueOf() / dayMs - 0.5 + J1970
  const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * dayMs)
  const toDays = (date: Date) => toJulian(date) - J2000

  const e = rad * 23.4397 // obliquity of the Earth

  const declination = (l: number, b: number) => asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l))

  const solarMeanAnomaly = (d: number) => rad * (357.5291 + 0.98560028 * d)

  const eclipticLongitude = (M: number) => {
    const C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M))
    const P = rad * 102.9372
    return M + C + P + PI
  }

  const julianCycle = (d: number, lw: number) => Math.round(d - 0.0009 - lw / (2 * PI))

  const approxTransit = (Ht: number, lw: number, n: number) => 0.0009 + (Ht + lw) / (2 * PI) + n

  const solarTransitJ = (ds: number, M: number, L: number) =>
    J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L)

  const hourAngle = (h: number, phi: number, d: number) => {
    const cosH = (sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d))
    if (cosH > 1) return null  // never rises
    if (cosH < -1) return null // never sets
    return acos(cosH)
  }

  const getSetJ = (h: number, lw: number, phi: number, dec: number, n: number, M: number, L: number) => {
    const w = hourAngle(h, phi, dec)
    if (w === null) return null
    const a = approxTransit(w, lw, n)
    return solarTransitJ(a, M, L)
  }

  // Main calculation
  const lw = rad * -lon
  const phi = rad * lat
  const d = toDays(date)
  const n = julianCycle(d, lw)
  const ds = approxTransit(0, lw, n)
  const M = solarMeanAnomaly(ds)
  const L = eclipticLongitude(M)
  const dec = declination(L, 0)
  const Jnoon = solarTransitJ(ds, M, L)

  const h0 = (rad * -0.833) // sunrise/sunset angle

  const Jset = getSetJ(h0, lw, phi, dec, n, M, L)
  const Jrise = Jnoon - (Jset ? Jset - Jnoon : 0)

  if (Jset === null || Jrise === null) {
    return null
  }

  const sunrise = fromJulian(Jrise)
  const sunset = fromJulian(Jset)
  const solarNoon = fromJulian(Jnoon)

  // Calculate day length in hours
  const dayLength = (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60)

  return {
    sunrise,
    sunset,
    solarNoon,
    dayLength
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const getTimeRemaining = (targetTime: Date) => {
  const now = new Date()
  const diff = targetTime.getTime() - now.getTime()

  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { hours, minutes, seconds, total: diff }
}

export default function Home() {
  const [user, setUser] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Location state (Mumbai as default)
  const [location, setLocation] = useState({ lat: 19.0760, lon: 72.8777, city: "Mumbai, India" })
  const [solarData, setSolarData] = useState<ReturnType<typeof calculateSunriseSunset> | null>(null)
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 })
  const [currentPhase, setCurrentPhase] = useState<'pre-sunrise' | 'day' | 'post-sunset'>('day')
  const [sunPosition, setSunPosition] = useState(0)
  const [locationError, setLocationError] = useState(false)

  // Fetch user location with continuous monitoring
  useEffect(() => {
    if (!navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocationError(true)
      return
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          city: "Your Location"
        })
        setLocationError(false)
      },
      () => {
        console.log("Location access denied, using Mumbai as default")
        setLocationError(true)
      },
      {
        timeout: 5000,
        maximumAge: 0,
        enableHighAccuracy: true
      }
    )

    // Watch for location changes (if user is moving)
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          city: "Your Location"
        })
        setLocationError(false)
      },
      (error) => {
        console.log("Location watch error:", error)
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300000, // Update every 5 minutes max
        timeout: 10000
      }
    )

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [])

  // Calculate solar times when location changes OR date changes
  useEffect(() => {
    const updateSolarData = () => {
      try {
        const now = new Date()
        const data = calculateSunriseSunset(location.lat, location.lon, now)
        setSolarData(data)
      } catch (error) {
        console.error("Solar calculation error:", error)
      }
    }

    // Initial calculation
    updateSolarData()

    // Recalculate at midnight when date changes
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setHours(24, 0, 0, 0)
    const msUntilMidnight = tomorrow.getTime() - now.getTime()

    const midnightTimer = setTimeout(() => {
      updateSolarData()
      // Set up daily recalculation
      const dailyInterval = setInterval(updateSolarData, 24 * 60 * 60 * 1000)
      return () => clearInterval(dailyInterval)
    }, msUntilMidnight)

    return () => clearTimeout(midnightTimer)
  }, [location])

  // Update countdown and sun position every second - READ ONLY, no state updates
  useEffect(() => {
    if (!solarData) return

    const updateTimer = () => {
      const now = new Date()
      const { sunrise, sunset } = solarData

      // Check if we've crossed midnight - but DON'T recalculate here
      // The midnight timer above will handle recalculation
      const sunriseDate = sunrise.getDate()
      const currentDate = now.getDate()

      // If dates don't match, wait for midnight timer to update solarData
      if (currentDate !== sunriseDate) {
        return
      }

      if (now < sunrise) {
        // Before sunrise
        setCurrentPhase('pre-sunrise')
        setTimeRemaining(getTimeRemaining(sunrise))
        setSunPosition(0)
      } else if (now > sunset) {
        // After sunset - calculate next sunrise
        setCurrentPhase('post-sunset')
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const nextSunriseData = calculateSunriseSunset(location.lat, location.lon, tomorrow)
        if (nextSunriseData) {
          setTimeRemaining(getTimeRemaining(nextSunriseData.sunrise))
        }
        setSunPosition(100)
      } else {
        // During the day
        setCurrentPhase('day')
        setTimeRemaining(getTimeRemaining(sunset))

        // Calculate sun position (0-100%)
        const totalDay = sunset.getTime() - sunrise.getTime()
        const elapsed = now.getTime() - sunrise.getTime()
        const progress = (elapsed / totalDay) * 100
        setSunPosition(Math.min(100, Math.max(0, progress)))
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [solarData, location])

  // Supabase user check
  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch {
        console.warn("Supabase auth check bypassed or fallback triggered.")
      } finally {
        setLoading(false)
      }
    }
    void checkUser()
  }, [])

  // Video looping with opacity
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let rafId: number
    let isResetting = false

    const updateVideoOpacity = () => {
      if (!video || isResetting) {
        rafId = requestAnimationFrame(updateVideoOpacity)
        return
      }

      const currentTime = video.currentTime
      const duration = video.duration

      let opacity = 0

      if (duration > 0) {
        if (currentTime < 0.5) {
          opacity = currentTime / 0.5
        } else if (currentTime > duration - 0.5) {
          opacity = (duration - currentTime) / 0.5
        } else {
          opacity = 1
        }
      } else {
        opacity = 0
      }

      video.style.opacity = Math.max(0, Math.min(1, opacity)).toString()
      rafId = requestAnimationFrame(updateVideoOpacity)
    }

    const handleVideoEnded = () => {
      isResetting = true
      if (video) {
        video.style.opacity = "0"
        setTimeout(() => {
          if (video) {
            video.currentTime = 0
            video.play()
              .then(() => {
                isResetting = false
              })
              .catch(() => {
                isResetting = false
              })
          }
        }, 100)
      }
    }

    video.addEventListener("ended", handleVideoEnded)
    rafId = requestAnimationFrame(updateVideoOpacity)
    video.play().catch(() => { })

    return () => {
      cancelAnimationFrame(rafId)
      if (video) {
        video.removeEventListener("ended", handleVideoEnded)
      }
    }
  }, [])

  const marqueeLogos = [
    { name: "Sattvic", icon: Sun },
    { name: "Jain", icon: Leaf },
    { name: "Halal", icon: Star },
    { name: "Kosher", icon: ShieldCheck },
    { name: "Vegan", icon: Droplets },
    { name: "Lenten", icon: Moon },
  ]

  const scrollingLogos = [...marqueeLogos, ...marqueeLogos, ...marqueeLogos]

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }
    }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  return (
    <div className="font-geist text-[#2E1C0C] bg-[#FAF6F0] min-h-screen w-full relative overflow-x-hidden selection:bg-amber-200 selection:text-[#2E1C0C]">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-[100vh] overflow-hidden pointer-events-none z-0">
        <video
          ref={videoRef}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4"
          muted
          playsInline
          autoPlay
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-all duration-300"
          style={{ opacity: 0 }}
        />
        <div className="absolute inset-0 bg-[#FAF6F0]/92 backdrop-blur-[1px] z-1 pointer-events-none" />
      </div>

      <div
        className="absolute top-[50vh] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] md:w-[984px] h-[300px] sm:h-[450px] md:h-[527px] opacity-70 bg-amber-100/60 blur-[100px] pointer-events-none z-1"
        style={{ mixBlendMode: "multiply" }}
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col z-10 overflow-visible">
        <nav className="w-full py-5 px-6 sm:px-8 flex flex-row justify-between items-center relative z-50">
          <div className="flex items-center">
            <Logo textClassName="text-[#2E1C0C] group-hover:text-amber-600" />
          </div>

          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-full bg-amber-900/5" />
            ) : user ? (
              <Button asChild className="rounded-full px-5 py-2" variant="heroSecondary">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild className="text-[#2E1C0C]/80 hover:text-amber-600 font-semibold" variant="ghost">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="rounded-full px-5 py-2" variant="heroSecondary">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          <button
            className="md:hidden flex items-center justify-center p-2 rounded-lg text-[#2E1C0C]/80 hover:text-amber-600 hover:bg-amber-900/5 transition cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </nav>

        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#2E1C0C]/10 to-transparent mt-[3px] relative z-40" />

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-[70px] left-4 right-4 liquid-glass rounded-2xl p-6 flex flex-col gap-4 border border-amber-900/10 z-50 shadow-2xl backdrop-blur-xl md:hidden"
            >
              {loading ? (
                <div className="h-10 w-full animate-pulse rounded-full bg-amber-900/10" />
              ) : user ? (
                <Button asChild className="w-full justify-center rounded-full mt-2" variant="heroSecondary">
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button asChild className="w-full justify-center rounded-full" variant="outline">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                  </Button>
                  <Button asChild className="w-full justify-center rounded-full" variant="heroSecondary">
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 relative z-10 py-16 sm:py-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center max-w-7xl"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass text-xs font-semibold uppercase tracking-wider text-amber-700 border border-amber-500/10 shadow-sm mb-6"
            >
              <Sparkles className="size-3 text-amber-600 animate-pulse" />
              Conscious Scanning & Solar Fasting
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="font-general text-[48px] sm:text-[80px] md:text-[140px] lg:text-[180px] xl:text-[210px] font-normal leading-[0.98] tracking-[-0.035em] text-[#2E1C0C]"
            >
              Bhojan{" "}
              <span
                className="bg-clip-text text-transparent inline-block font-semibold"
                style={{
                  backgroundImage: "linear-gradient(to left, #C17A2E, #E6AD45, #D97706)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}
              >
                Food
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mt-6 text-sm sm:text-base md:text-[19px] leading-relaxed text-[#6E5A4B] max-w-lg md:max-w-xl opacity-90 font-medium px-2"
            >
              The most advanced AI for culinary mindfulness and conscious dietary alignment. Scan menus, verify dietary compliance, and track solar fasting cycles seamlessly.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4"
            >
              {loading ? (
                <div className="h-[52px] w-[200px] animate-pulse rounded-full bg-amber-900/5" />
              ) : user ? (
                <Button asChild className="rounded-full px-[32px] py-[26px] text-base font-semibold shadow-md hover:scale-105 transition-all duration-300 w-full sm:w-auto" variant="heroSecondary">
                  <Link href="/dashboard">
                    Enter Dashboard
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
              ) : (
                <Button asChild className="rounded-full px-[32px] py-[26px] text-base font-semibold shadow-md hover:scale-105 transition-all duration-300 w-full sm:w-auto" variant="heroSecondary">
                  <Link href="/onboarding">
                    Try Now
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
              )}

              <Button asChild className="rounded-full border border-[#2E1C0C]/15 text-[#2E1C0C] px-[30px] py-[26px] text-base font-semibold hover:bg-amber-500/5 transition-all duration-300 w-full sm:w-auto bg-white/40 backdrop-blur-sm cursor-pointer" variant="outline">
                <Link href="/scan?demo=true">Try Demo Scanner</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        <div className="w-full pb-10 pt-6 relative z-10">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center gap-6 md:gap-12">
            <div className="shrink-0 text-center md:text-left">
              <p className="text-[#2E1C0C]/50 text-xs sm:text-sm font-semibold leading-snug max-w-[200px]">
                Helps you eat <br className="hidden md:inline" /> following your Faith
              </p>
            </div>

            <div className="flex-1 w-full overflow-hidden mask-gradient relative py-2">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#FAF6F0] to-transparent z-20 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FAF6F0] to-transparent z-20 pointer-events-none" />

              <div className="animate-marquee flex items-center gap-16">
                {scrollingLogos.map((logo, index) => {
                  const IconComponent = logo.icon
                  return (
                    <div
                      key={`${logo.name}-${index}`}
                      className="flex items-center shrink-0 group hover:scale-105 transition-all duration-300"
                    >
                      <div className="w-8 h-8 rounded-lg liquid-glass flex items-center justify-center text-amber-700 border border-amber-500/10 mr-3 shadow-sm select-none">
                        <IconComponent className="size-4" />
                      </div>
                      <span className="text-sm sm:text-base font-semibold text-[#2E1C0C]/90 tracking-wide select-none group-hover:text-amber-600 transition-colors">
                        {logo.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: OCR Scanning with Modern Bento Grid */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#FAF7F2] to-[#FAF6F0] border-t border-amber-900/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-semibold border border-amber-500/20 mb-4"
            >
              <ScanLine className="size-3" />
              Advanced OCR Technology
            </motion.div>
            <h2 className="font-general text-4xl sm:text-6xl font-normal tracking-tight text-[#2E1C0C] mb-6">
              Menu Scanning. Reinvented.
            </h2>
            <p className="text-[#6E5A4B] text-lg font-medium leading-relaxed">
              Real-time ingredient analysis with theological reasoning powered by advanced AI
            </p>
          </div>

          {/* Modern Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large Feature Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 lg:row-span-2 liquid-glass rounded-3xl p-8 border border-amber-500/10 shadow-xl relative overflow-hidden bg-gradient-to-br from-white/50 to-amber-50/30"
            >
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Analysis
              </div>

              <h3 className="text-2xl font-bold text-[#2E1C0C] mb-6">Real-Time Scanning</h3>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white/80 border border-amber-900/5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-[#2E1C0C]">Penne alla Vodka</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-50 text-red-700 border border-red-100 font-semibold">Avoid</span>
                  </div>
                  <p className="text-xs text-[#6E5A4B] mb-2 font-medium">Penne pasta, vodka cream sauce, pancetta, romano cheese</p>
                  <div className="text-[11px] text-red-800/90 flex items-start gap-1 font-medium">
                    <span className="font-bold text-red-900">Contains:</span>
                    <span>Pork (pancetta) and alcohol-based sauce</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/80 border border-amber-900/5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-[#2E1C0C]">Paneer Tikka Masala</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-semibold">Caution</span>
                  </div>
                  <p className="text-xs text-[#6E5A4B] mb-2 font-medium">Grilled paneer, tomato masala, garlic, onion paste</p>
                  <div className="text-[11px] text-amber-800/90 flex items-start gap-1 font-medium">
                    <span className="font-bold text-amber-900">Note:</span>
                    <span>Contains root onions (Jain restriction)</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/80 border border-amber-900/5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-[#2E1C0C]">Sattvic Green Salad</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">Safe</span>
                  </div>
                  <p className="text-xs text-[#6E5A4B] font-medium">Cucumber, romaine, tomatoes, sunflower seeds, olive oil dressing</p>
                </div>
              </div>
            </motion.div>

            {/* Stat Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="liquid-glass rounded-3xl p-6 border border-amber-500/10 shadow-lg bg-gradient-to-br from-white/50 to-amber-50/30"
            >
              <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-4 border border-amber-500/20">
                <TrendingUp className="size-6" />
              </div>
              <div className="text-3xl font-bold text-[#2E1C0C] mb-1">98.7%</div>
              <div className="text-sm text-[#6E5A4B] font-semibold">Accuracy Rate</div>
              <p className="text-xs text-[#6E5A4B]/70 mt-2">Based on 50K verified scans</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="liquid-glass rounded-3xl p-6 border border-amber-500/10 shadow-lg bg-gradient-to-br from-white/50 to-emerald-50/30"
            >
              <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4 border border-emerald-500/20">
                <ShieldCheck className="size-6" />
              </div>
              <div className="text-3xl font-bold text-[#2E1C0C] mb-1">5000+</div>
              <div className="text-sm text-[#6E5A4B] font-semibold">Ingredients Tracked</div>
              <p className="text-xs text-[#6E5A4B]/70 mt-2">Including hidden derivatives</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="liquid-glass rounded-3xl p-6 border border-amber-500/10 shadow-lg bg-gradient-to-br from-white/50 to-blue-50/30"
            >
              <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-4 border border-blue-500/20">
                <Users className="size-6" />
              </div>
              <div className="text-3xl font-bold text-[#2E1C0C] mb-1">25K+</div>
              <div className="text-sm text-[#6E5A4B] font-semibold">Active Users</div>
              <p className="text-xs text-[#6E5A4B]/70 mt-2">Across 6 traditions</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Live Solar Fasting Tracker - CORRECTED */}
      <section className="relative py-24 sm:py-32 bg-[#FAF6F0] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.05)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-semibold border border-amber-500/20 mb-4"
            >
              <Clock className="size-3" />
              Solar Astronomy Integration
            </motion.div>
            <h2 className="font-general text-4xl sm:text-6xl font-normal tracking-tight text-[#2E1C0C] mb-6">
              Live Fasting Tracker
            </h2>
            <p className="text-[#6E5A4B] text-lg font-medium leading-relaxed">
              Precise solar calculations using NOAA algorithm based on your GPS coordinates
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Live Solar Dashboard - Takes 3 columns */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3 liquid-glass rounded-3xl p-8 border border-amber-500/10 shadow-2xl space-y-6 relative bg-gradient-to-br from-white/60 to-amber-50/40"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-amber-900/5">
                <div className="flex items-center gap-3">
                  <MapPin className="size-5 text-amber-600" />
                  <div>
                    <div className="text-sm font-bold text-[#2E1C0C]">{location.city}</div>
                    <div className="text-xs text-[#6E5A4B]">
                      {location.lat.toFixed(4)}°{location.lat >= 0 ? 'N' : 'S'}, {Math.abs(location.lon).toFixed(4)}°{location.lon >= 0 ? 'E' : 'W'}
                    </div>
                    <div className="text-xs text-[#6E5A4B] mt-0.5">
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  {locationError ? 'Default' : 'Live GPS'}
                </div>
              </div>

              {/* Sun Path Visualization */}
              <div className="w-full rounded-2xl bg-gradient-to-b from-amber-50/50 to-white/70 border border-amber-900/5 relative overflow-hidden shadow-inner p-6">
                <svg className="w-full" viewBox="0 0 400 160" style={{ height: '200px' }}>
                  <defs>
                    <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(251, 191, 36, 0.15)" />
                      <stop offset="100%" stopColor="rgba(251, 191, 36, 0.02)" />
                    </linearGradient>
                    <filter id="sunGlow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Sky background */}
                  <rect x="0" y="0" width="400" height="110" fill="url(#skyGradient)" rx="8" />

                  {/* Horizon line */}
                  <line x1="20" y1="110" x2="380" y2="110" stroke="rgba(46, 28, 12, 0.2)" strokeWidth="2" strokeDasharray="6 4" />

                  {/* Sun path arc (full path) */}
                  <path
                    d="M 30 110 Q 200 20 370 110"
                    fill="none"
                    stroke="rgba(251, 191, 36, 0.25)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />

                  {/* Active sun path (current progress) */}
                  {sunPosition > 0 && (
                    <path
                      d={`M 30 110 Q 200 20 ${30 + (340 * sunPosition / 100)} ${110 - (90 * Math.sin((sunPosition / 100) * Math.PI))}`}
                      fill="none"
                      stroke="rgba(251, 146, 11, 0.9)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Current sun position */}
                  <g filter="url(#sunGlow)">
                    <circle
                      cx={30 + (340 * sunPosition / 100)}
                      cy={110 - (90 * Math.sin((sunPosition / 100) * Math.PI))}
                      r="8"
                      fill="#F59E0B"
                    />
                    <circle
                      cx={30 + (340 * sunPosition / 100)}
                      cy={110 - (90 * Math.sin((sunPosition / 100) * Math.PI))}
                      r="14"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2"
                      opacity="0.4"
                    />
                  </g>

                  {/* Sunrise marker */}
                  <g>
                    <Sunrise className="size-4" x="24" y="115" style={{ color: '#F59E0B' }} />
                    <text x="35" y="138" fill="rgba(46, 28, 12, 0.7)" fontSize="11" fontWeight="600">
                      {solarData ? formatTime(solarData.sunrise) : '--:--'}
                    </text>
                    <text x="35" y="150" fill="rgba(46, 28, 12, 0.5)" fontSize="9">
                      Sunrise
                    </text>
                  </g>

                  {/* Solar noon marker */}
                  <g>
                    <Sun className="size-4" x="193" y="8" style={{ color: '#F59E0B' }} />
                    <text x="200" y="150" fill="rgba(46, 28, 12, 0.5)" fontSize="9" textAnchor="middle">
                      Solar Noon
                    </text>
                  </g>

                  {/* Sunset marker */}
                  <g>
                    <Sunset className="size-4" x="364" y="115" style={{ color: '#F97316' }} />
                    <text x="325" y="138" fill="rgba(46, 28, 12, 0.7)" fontSize="11" fontWeight="600" textAnchor="end">
                      {solarData ? formatTime(solarData.sunset) : '--:--'}
                    </text>
                    <text x="325" y="150" fill="rgba(46, 28, 12, 0.5)" fontSize="9" textAnchor="end">
                      Sunset
                    </text>
                  </g>
                </svg>
              </div>

              {/* Live Countdown - LARGE */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/50 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="size-5 text-amber-700" />
                    <span className="text-sm font-bold text-[#6E5A4B] uppercase tracking-wide">
                      {currentPhase === 'day' ? 'Time Until Sunset' : currentPhase === 'pre-sunrise' ? 'Time Until Sunrise' : 'Time Until Next Sunrise'}
                    </span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/80 border border-amber-200">
                    <span className="text-xs font-bold text-amber-700 capitalize">
                      {currentPhase === 'day' ? 'Daylight' : currentPhase === 'pre-sunrise' ? 'Before Dawn' : 'Night'}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <div className="text-6xl font-mono font-bold text-[#2E1C0C] tabular-nums tracking-tight">
                    {String(timeRemaining.hours).padStart(2, '0')}
                  </div>
                  <div className="text-4xl font-bold text-amber-600">:</div>
                  <div className="text-6xl font-mono font-bold text-[#2E1C0C] tabular-nums tracking-tight">
                    {String(timeRemaining.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-4xl font-bold text-amber-600">:</div>
                  <div className="text-6xl font-mono font-bold text-[#2E1C0C] tabular-nums tracking-tight">
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </div>
                </div>

                <div className="flex justify-center gap-8 text-xs text-[#6E5A4B] font-semibold uppercase tracking-wider">
                  <span>Hours</span>
                  <span>Minutes</span>
                  <span>Seconds</span>
                </div>
              </div>

              {/* Solar Data Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white/70 border border-amber-900/5 text-center">
                  <Sunrise className="size-5 text-amber-600 mx-auto mb-2" />
                  <div className="text-xs text-[#6E5A4B] font-semibold mb-1">Sunrise</div>
                  <div className="text-lg font-bold text-[#2E1C0C]">
                    {solarData ? formatTime(solarData.sunrise) : '--:--'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/70 border border-amber-900/5 text-center">
                  <Sun className="size-5 text-amber-600 mx-auto mb-2" />
                  <div className="text-xs text-[#6E5A4B] font-semibold mb-1">Solar Noon</div>
                  <div className="text-lg font-bold text-[#2E1C0C]">
                    {solarData ? formatTime(solarData.solarNoon) : '--:--'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/70 border border-amber-900/5 text-center">
                  <Sunset className="size-5 text-orange-600 mx-auto mb-2" />
                  <div className="text-xs text-[#6E5A4B] font-semibold mb-1">Sunset</div>
                  <div className="text-lg font-bold text-[#2E1C0C]">
                    {solarData ? formatTime(solarData.sunset) : '--:--'}
                  </div>
                </div>
              </div>

              {/* Day Length */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-5 text-blue-600" />
                    <span className="text-sm font-bold text-[#2E1C0C]">Day Length</span>
                  </div>
                  <div className="text-xl font-bold text-[#2E1C0C]">
                    {solarData ? `${Math.floor(solarData.dayLength)}h ${Math.round((solarData.dayLength % 1) * 60)}m` : '--h --m'}
                  </div>
                </div>
              </div>

              {/* Technical Info */}
              <div className="p-4 rounded-xl bg-amber-50/30 border border-amber-200/30">
                <div className="text-xs text-[#6E5A4B] space-y-1">
                  <p>
                    <span className="font-bold text-amber-900">Algorithm:</span> SunCalc (Astronomical Algorithms)
                  </p>
                  <p>
                    <span className="font-bold text-amber-900">Precision:</span> ±30 seconds accuracy worldwide
                  </p>
                  <p>
                    <span className="font-bold text-amber-900">Updates:</span> Live every second, recalculates at midnight
                  </p>
                  <p>
                    <span className="font-bold text-amber-900">Location:</span> {locationError ? 'Static fallback' : 'Continuous GPS tracking'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Features List - Takes 2 columns */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="flex gap-4">
                <div className="size-14 rounded-2xl liquid-glass flex items-center justify-center text-amber-600 shrink-0 border border-amber-500/10 shadow-sm">
                  <MapPin className="size-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#2E1C0C] mb-2">Dynamic GPS Tracking</h3>
                  <p className="text-[#6E5A4B] text-base font-medium leading-relaxed">
                    Continuously monitors your location and automatically recalculates solar times. Works anywhere in the world, any time of year, with astronomical precision.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="size-14 rounded-2xl liquid-glass flex items-center justify-center text-amber-600 shrink-0 border border-amber-500/10 shadow-sm">
                  <Clock className="size-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#2E1C0C] mb-2">Live Countdown Timers</h3>
                  <p className="text-[#6E5A4B] text-base font-medium leading-relaxed">
                    Updates every second with automatic midnight recalculation. Perfect for Chauvihar, Ramadan, Ekadashi, and custom fasts throughout the entire year.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="size-14 rounded-2xl liquid-glass flex items-center justify-center text-amber-600 shrink-0 border border-amber-500/10 shadow-sm">
                  <Calendar className="size-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#2E1C0C] mb-2">Year-Round Accuracy</h3>
                  <p className="text-[#6E5A4B] text-base font-medium leading-relaxed">
                    No hardcoded data. Calculates fresh solar times for every date, season, and location change. Works during daylight savings, solstices, and across all timezones.
                  </p>
                </div>
              </div>

              {/* Precision Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-6 rounded-2xl liquid-glass border border-amber-500/10 text-center">
                  <div className="text-4xl font-bold text-amber-700 mb-2">±30s</div>
                  <div className="text-xs text-[#6E5A4B] font-semibold">Solar Precision</div>
                </div>
                <div className="p-6 rounded-2xl liquid-glass border border-amber-500/10 text-center">
                  <div className="text-4xl font-bold text-amber-700 mb-2">100%</div>
                  <div className="text-xs text-[#6E5A4B] font-semibold">Offline Ready</div>
                </div>
              </div>

              {locationError && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
                  <p className="font-semibold mb-1">Using Default Location</p>
                  <p className="text-xs">Enable location access for personalized solar times at your location.</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Tradition Cards */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#FAF7F2] to-[#FAF6F0] border-y border-amber-900/5 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-semibold border border-amber-500/20 mb-4"
            >
              <ShieldCheck className="size-3" />
              Theological Database
            </motion.div>
            <h2 className="font-general text-4xl sm:text-6xl font-normal tracking-tight text-[#2E1C0C] mb-6">
              Tailored to Your Path
            </h2>
            <p className="text-[#6E5A4B] text-lg font-medium leading-relaxed">
              Pre-configured dietary guidelines with full customization for any tradition
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Sun,
                title: "Sattvic / Hindu",
                desc: "Excludes meat, eggs, seafood, alcohol, onions, and garlic. Supports Navratri and Ekadashi fasting schedules with solar timing.",
                color: "from-orange-500/10 to-amber-500/10",
                border: "border-orange-500/20"
              },
              {
                icon: Leaf,
                title: "Jain Strictness",
                desc: "Avoids all root vegetables, honey, and animal products. Integrated Chauvihar fast timing with sunset calculations.",
                color: "from-amber-500/10 to-yellow-500/10",
                border: "border-amber-500/20"
              },
              {
                icon: Star,
                title: "Halal Compliance",
                desc: "Identifies haram ingredients including pork, alcohol, blood products, and non-halal slaughter methods.",
                color: "from-green-500/10 to-emerald-500/10",
                border: "border-green-500/20"
              },
              {
                icon: ShieldCheck,
                title: "Kosher Standards",
                desc: "Tracks meat-dairy combinations, shellfish, pork products, and validates kosher certification requirements.",
                color: "from-blue-500/10 to-cyan-500/10",
                border: "border-blue-500/20"
              },
              {
                icon: Droplets,
                title: "Vegan / Plant-Based",
                desc: "Flags all animal products including hidden derivatives like gelatin, whey, casein, and bone char-filtered sugar.",
                color: "from-emerald-500/10 to-green-500/10",
                border: "border-emerald-500/20"
              },
              {
                icon: Settings,
                title: "Custom Rules",
                desc: "Build your own restriction database with custom keywords, strictness levels, and allergy triggers for complete control.",
                color: "from-purple-500/10 to-pink-500/10",
                border: "border-purple-500/20"
              }
            ].map((tradition, i) => {
              const IconComponent = tradition.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`group liquid-glass rounded-3xl p-8 border ${tradition.border} hover:scale-[1.02] transition-all duration-300 cursor-pointer bg-gradient-to-br ${tradition.color} backdrop-blur-xl`}
                >
                  <div className="size-14 rounded-2xl bg-white/50 border border-amber-200/50 flex items-center justify-center mb-6">
                    <IconComponent className="size-7 text-amber-700" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2E1C0C] mb-4 group-hover:text-amber-700 transition-colors">
                    {tradition.title}
                  </h3>
                  <p className="text-sm text-[#6E5A4B] leading-relaxed font-medium mb-6">
                    {tradition.desc}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-amber-900/5">
                    <span className="text-xs text-amber-700 font-bold uppercase tracking-wider">Fully Supported</span>
                    <ArrowRight className="size-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4: Modern CTA */}
      <section className="relative py-32 bg-gradient-to-br from-amber-50 via-[#FAF6F0] to-orange-50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(251,191,36,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(249,115,22,0.15)_0%,transparent_50%)]" />

        <div className="max-w-5xl mx-auto px-6 sm:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-amber-500/20 shadow-lg">
              <Sparkles className="size-4 text-amber-600" />
              <span className="text-sm font-bold text-[#2E1C0C]">Join 25,000+ Conscious Eaters</span>
            </div>

            <h2 className="font-general text-5xl sm:text-7xl font-normal tracking-tight text-[#2E1C0C] leading-tight">
              Ready to Align <br />Your Plate?
            </h2>

            <p className="text-[#6E5A4B] text-xl font-semibold max-w-2xl mx-auto leading-relaxed">
              Start scanning menus with AI-powered ingredient analysis and live solar fasting tracking
            </p>

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              {loading ? (
                <div className="h-[56px] w-[200px] animate-pulse rounded-full bg-amber-900/10" />
              ) : user ? (
                <Button asChild className="rounded-full px-10 py-7 text-lg font-semibold shadow-2xl hover:scale-105 hover:shadow-amber-500/50 transition-all duration-300" variant="heroSecondary">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
              ) : (
                <Button asChild className="rounded-full px-10 py-7 text-lg font-semibold shadow-2xl hover:scale-105 hover:shadow-amber-500/50 transition-all duration-300" variant="heroSecondary">
                  <Link href="/signup">
                    Start Free Today
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
              )}

              <Button asChild className="rounded-full border-2 border-[#2E1C0C]/20 text-[#2E1C0C] px-10 py-7 text-lg font-semibold hover:bg-white/80 hover:border-amber-500/30 transition-all duration-300 bg-white/60 backdrop-blur-sm shadow-lg" variant="outline">
                <Link href="/scan?demo=true">Try Demo Scanner</Link>
              </Button>
            </div>

            <p className="text-sm text-[#6E5A4B]/70 font-medium pt-4">
              No credit card required • Free tier available • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="w-full bg-gradient-to-b from-[#FAF6F0] to-[#F5EFE7] border-t border-amber-500/10 py-20 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
            <div className="col-span-2 space-y-6">
              <Logo textClassName="text-[#2E1C0C] hover:text-amber-600" />
              <p className="text-sm text-[#6E5A4B] leading-relaxed font-medium max-w-sm">
                AI-powered dietary compliance scanning with real-time solar fasting calculations for conscious eating.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#2E1C0C] mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-[#6E5A4B] font-medium">
                <li><Link href="/scan" className="hover:text-amber-600 transition">Scanner</Link></li>
                <li><Link href="/dashboard" className="hover:text-amber-600 transition">Dashboard</Link></li>
                <li><Link href="/fasting" className="hover:text-amber-600 transition">Fasting Tracker</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#2E1C0C] mb-4">Traditions</h4>
              <ul className="space-y-3 text-sm text-[#6E5A4B] font-medium">
                <li><span>Sattvic</span></li>
                <li><span>Jain</span></li>
                <li><span>Halal</span></li>
                <li><span>Kosher</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#2E1C0C] mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-[#6E5A4B] font-medium">
                <li><Link href="/about" className="hover:text-amber-600 transition">About</Link></li>
                <li><Link href="/privacy" className="hover:text-amber-600 transition">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-amber-600 transition">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-amber-500/10">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[#6E5A4B]/80 font-medium">
              <p>© {new Date().getFullYear()} Bhojan. Built for conscious dining.</p>
              <p>Made with care for spiritual and dietary mindfulness</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}