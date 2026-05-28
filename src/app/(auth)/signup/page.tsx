"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Step = 1 | 2 | 3

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [loading, setLoading] = useState(false)

  // Step 1: Account credentials
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Step 2: Personal details
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")

  // Step 3: Delivery and preferences
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([])
  const [householdSize, setHouseholdSize] = useState("1")

  const dietaryOptions = [
    { value: "vegetarian", label: "Vegetarian" },
    { value: "vegan", label: "Vegan" },
    { value: "gluten-free", label: "Gluten-Free" },
    { value: "dairy-free", label: "Dairy-Free" },
    { value: "nut-allergy", label: "Nut Allergy" },
  ]

  const toggleDietaryPreference = (value: string) => {
    setDietaryPreferences((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  const handleStep1 = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setStep(2)
  }

  const handleStep2 = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (phone.length < 10) {
      setError("Please enter a valid phone number")
      return
    }

    setStep(3)
  }

  const handleStep3 = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    setSuccessMessage("")

    let supabase

    try {
      supabase = createClient()
    } catch (clientError) {
      setError(clientError instanceof Error ? clientError.message : "Supabase is not configured.")
      setLoading(false)
      return
    }

    // Create auth user
    const { data: signupData, error: signupError } = await supabase.auth.signUp({ email, password })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    if (!signupData.user) {
      setError("Failed to create account")
      setLoading(false)
      return
    }

    // Save profile data
    const { error: profileError } = await supabase.from("profiles").insert({
      id: signupData.user.id,
      full_name: fullName,
      phone: phone,
      address: address,
      city: city,
      postal_code: postalCode,
      dietary_preferences: dietaryPreferences,
      household_size: parseInt(householdSize),
      created_at: new Date().toISOString(),
    })

    if (profileError) {
      setError("Account created but profile setup failed. Please complete your profile in settings.")
    }

    // If Supabase created the user but did not return a session, email confirmation is active.
    if (signupData.user && !signupData.session) {
      setError("")
      setLoading(false)
      setSuccessMessage(
        "Account created! Please check your email inbox to confirm your account before signing in."
      )
      return
    }

    router.push("/onboarding")
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-8">
      <div className="w-full rounded-2xl border border-[#E8E3DC] bg-white p-6 shadow-sm">
        {/* Progress indicator */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-16 rounded-full ${step >= 1 ? "bg-[#C17A2E]" : "bg-[#E8E3DC]"
                }`}
            />
            <div
              className={`h-2 w-16 rounded-full ${step >= 2 ? "bg-[#C17A2E]" : "bg-[#E8E3DC]"
                }`}
            />
            <div
              className={`h-2 w-16 rounded-full ${step >= 3 ? "bg-[#C17A2E]" : "bg-[#E8E3DC]"
                }`}
            />
          </div>
          <span className="text-xs font-medium text-[#666666]">Step {step} of 3</span>
        </div>

        {/* Step 1: Account credentials */}
        {step === 1 && (
          <form onSubmit={handleStep1}>
            <h1 className="font-heading text-3xl font-semibold text-[#1A1A1A]">Create account</h1>
            <p className="mt-2 text-sm text-[#666666]">Set up your login credentials.</p>

            <label className="mt-6 block text-xs font-medium text-[#666666]" htmlFor="email">
              Email
            </label>
            <Input
              className="mt-2 min-h-11 rounded-xl border-[#E8E3DC] bg-white"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />

            <label className="mt-4 block text-xs font-medium text-[#666666]" htmlFor="password">
              Password
            </label>
            <Input
              className="mt-2 min-h-11 rounded-xl border-[#E8E3DC] bg-white"
              id="password"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />

            <label className="mt-4 block text-xs font-medium text-[#666666]" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <Input
              className="mt-2 min-h-11 rounded-xl border-[#E8E3DC] bg-white"
              id="confirmPassword"
              minLength={6}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />

            {error ? <p className="mt-4 text-sm text-[#C0392B]">{error}</p> : null}

            <Button
              className="mt-6 min-h-12 w-full rounded-full bg-[#C17A2E] text-white hover:bg-[#A66520]"
              type="submit"
            >
              Continue
            </Button>

            <p className="mt-5 text-center text-sm text-[#666666]">
              Already have an account?{" "}
              <Link className="font-medium text-[#C17A2E]" href="/login">
                Sign in
              </Link>
            </p>
          </form>
        )}

        {/* Step 2: Personal details */}
        {step === 2 && (
          <form onSubmit={handleStep2}>
            <h1 className="font-heading text-3xl font-semibold text-[#1A1A1A]">Personal details</h1>
            <p className="mt-2 text-sm text-[#666666]">Help us personalize your experience.</p>

            <label className="mt-6 block text-xs font-medium text-[#666666]" htmlFor="fullName">
              Full Name
            </label>
            <Input
              className="mt-2 min-h-11 rounded-xl border-[#E8E3DC] bg-white"
              id="fullName"
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
              required
              type="text"
              value={fullName}
            />

            <label className="mt-4 block text-xs font-medium text-[#666666]" htmlFor="phone">
              Phone Number
            </label>
            <Input
              className="mt-2 min-h-11 rounded-xl border-[#E8E3DC] bg-white"
              id="phone"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 98765 43210"
              required
              type="tel"
              value={phone}
            />

            {error ? <p className="mt-4 text-sm text-[#C0392B]">{error}</p> : null}

            <div className="mt-6 flex gap-3">
              <Button
                className="min-h-12 flex-1 rounded-full border border-[#E8E3DC] bg-white text-[#1A1A1A] hover:bg-[#F5F5F5]"
                onClick={() => setStep(1)}
                type="button"
              >
                Back
              </Button>
              <Button
                className="min-h-12 flex-1 rounded-full bg-[#C17A2E] text-white hover:bg-[#A66520]"
                type="submit"
              >
                Continue
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Delivery and preferences */}
        {step === 3 && (
          <form onSubmit={handleStep3}>
            <h1 className="font-heading text-3xl font-semibold text-[#1A1A1A]">Delivery details</h1>
            <p className="mt-2 text-sm text-[#666666]">Where should we deliver your meals?</p>

            <label className="mt-6 block text-xs font-medium text-[#666666]" htmlFor="address">
              Street Address
            </label>
            <Input
              className="mt-2 min-h-11 rounded-xl border-[#E8E3DC] bg-white"
              id="address"
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Building name, street, area"
              required
              type="text"
              value={address}
            />

            <div className="mt-4 flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#666666]" htmlFor="city">
                  City
                </label>
                <Input
                  className="mt-2 min-h-11 rounded-xl border-[#E8E3DC] bg-white"
                  id="city"
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Mumbai"
                  required
                  type="text"
                  value={city}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#666666]" htmlFor="postalCode">
                  Postal Code
                </label>
                <Input
                  className="mt-2 min-h-11 rounded-xl border-[#E8E3DC] bg-white"
                  id="postalCode"
                  onChange={(event) => setPostalCode(event.target.value)}
                  placeholder="400001"
                  required
                  type="text"
                  value={postalCode}
                />
              </div>
            </div>

            <label className="mt-4 block text-xs font-medium text-[#666666]">
              Dietary Preferences (optional)
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {dietaryOptions.map((option) => (
                <button
                  key={option.value}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${dietaryPreferences.includes(option.value)
                    ? "border-[#C17A2E] bg-[#C17A2E]/10 text-[#C17A2E]"
                    : "border-[#E8E3DC] bg-white text-[#666666] hover:border-[#C17A2E]/50"
                    }`}
                  onClick={() => toggleDietaryPreference(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-xs font-medium text-[#666666]" htmlFor="householdSize">
              Household Size (optional)
            </label>
            <select
              className="mt-2 min-h-11 w-full rounded-xl border border-[#E8E3DC] bg-white px-4 text-sm text-[#1A1A1A]"
              id="householdSize"
              onChange={(event) => setHouseholdSize(event.target.value)}
              value={householdSize}
            >
              <option value="1">1 person</option>
              <option value="2">2 people</option>
              <option value="3">3 people</option>
              <option value="4">4 people</option>
              <option value="5">5+ people</option>
            </select>

            {error ? <p className="mt-4 text-sm text-[#C0392B]">{error}</p> : null}

            {successMessage ? (
              <div className="mt-4 rounded-xl border border-[#2E7D5B]/20 bg-[#EDF7F2] p-4 text-sm leading-6 text-[#2E7D5B]">
                {successMessage}
              </div>
            ) : null}

            <div className="mt-6 flex gap-3">
              <Button
                className="min-h-12 flex-1 rounded-full border border-[#E8E3DC] bg-white text-[#1A1A1A] hover:bg-[#F5F5F5]"
                disabled={loading}
                onClick={() => setStep(2)}
                type="button"
              >
                Back
              </Button>
              <Button
                className="min-h-12 flex-1 rounded-full bg-[#C17A2E] text-white hover:bg-[#A66520]"
                disabled={loading}
                type="submit"
              >
                {loading ? "Creating..." : "Complete Signup"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}