import { profileInputSchema } from "@/lib/schemas"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  let supabase
  let user

  try {
    supabase = await createClient()
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch {
    return NextResponse.json({ profile: null, local: true })
  }

  if (!user) {
    return NextResponse.json({ profile: null }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}

export async function POST(request: Request) {
  const parsed = profileInputSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const body = parsed.data
  let supabase
  let user

  try {
    supabase = await createClient()
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch {
    return NextResponse.json({ profile: { ...body, id: "local-demo-user" }, local: true })
  }

  if (!user) {
    return NextResponse.json({ profile: { ...body, id: "local-demo-user" }, local: true })
  }

  const payload = {
    id: user.id,
    tradition: body.tradition,
    sub_tradition: body.subTradition ?? null,
    strictness: body.strictness ?? "standard",
    allergies: body.allergies ?? [],
    dislikes: body.dislikes ?? [],
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single()

  if (error) {
    console.error("Profile upsert error details:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}
