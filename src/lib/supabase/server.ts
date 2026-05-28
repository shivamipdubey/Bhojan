import { createServerClient } from "@supabase/ssr"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { cookies } from "next/headers"

export const createClient = async () => {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase is not configured with a valid URL and anon key.")
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components can read cookies but cannot always write them.
          }
        }
      }
    }
  )
}
