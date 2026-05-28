import { createServerClient } from "@supabase/ssr"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { NextResponse, type NextRequest } from "next/server"

const publicPaths = ["/", "/login", "/signup", "/onboarding", "/guide"]
const appPaths = ["/dashboard", "/scan", "/history", "/observance", "/marketplace", "/profile", "/guide"]

const isPublicPath = (pathname: string) =>
  publicPaths.includes(pathname) ||
  pathname.startsWith("/api/") ||
  pathname.startsWith("/_next/") ||
  pathname.startsWith("/demo/") ||
  pathname.includes(".")

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!hasSupabaseConfig()) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  const redirectWithCookies = (pathname: string) => {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    const redirectResponse = NextResponse.redirect(url)
    
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
      })
    })
    
    return redirectResponse
  }

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    if (request.nextUrl.pathname === "/scan" && request.nextUrl.searchParams.get("demo") === "true") {
      return response
    }

    return redirectWithCookies("/login")
  }

  const isAppPath = appPaths.some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`))

  if (user && isAppPath) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      console.error("Proxy profile query error:", profileError)
    }

    if (!profile) {
      return redirectWithCookies("/onboarding")
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}
