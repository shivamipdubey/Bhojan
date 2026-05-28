import { createBrowserClient } from "@supabase/ssr"
import { hasSupabaseConfig } from "@/lib/supabase/config"

export const createClient = () => {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase is not configured with a valid URL and anon key.")
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
