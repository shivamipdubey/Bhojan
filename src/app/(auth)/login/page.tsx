"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    let supabase

    try {
      supabase = createClient()
    } catch (clientError) {
      setError(clientError instanceof Error ? clientError.message : "Supabase is not configured.")
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    const { data } = await supabase.from("profiles").select("id").maybeSingle()
    router.push(data ? "/dashboard" : "/onboarding")
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form className="w-full rounded-2xl border border-[#E8E3DC] bg-white p-6 shadow-sm" onSubmit={submit}>
        <h1 className="font-heading text-3xl font-semibold text-[#1A1A1A]">Welcome back</h1>
        <p className="mt-2 text-sm text-[#666666]">Sign in to keep your practice profile synced.</p>

        <label className="mt-8 block text-xs font-medium text-[#666666]" htmlFor="email">
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
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />

        {error ? <p className="mt-4 text-sm text-[#C0392B]">{error}</p> : null}

        <Button className="mt-6 min-h-12 w-full rounded-full bg-[#C17A2E] text-white hover:bg-[#A66520]" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        <p className="mt-5 text-center text-sm text-[#666666]">
          New here?{" "}
          <Link className="font-medium text-[#C17A2E]" href="/signup">
            Create account
          </Link>
        </p>
      </form>
    </main>
  )
}
