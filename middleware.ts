import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Re-instantiate the response with the modified request headers
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: This refreshes the auth token and triggers setAll if needed
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // 1. NOT LOGGED IN: Redirect to login
  if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/result')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // FIX: Merge cookies from supabaseResponse into the redirect response
    return NextResponse.redirect(url, { headers: supabaseResponse.headers })
  }

  // 2. LOGGED IN ON LOGIN PAGE: Redirect to dashboard based on role
  if (user && pathname.startsWith('/login')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const url = request.nextUrl.clone()
    url.pathname = profile?.role === 'student' ? '/student' : '/admin'
    // FIX: Merge cookies from supabaseResponse into the redirect response
    return NextResponse.redirect(url, { headers: supabaseResponse.headers })
  }

  // 3. ROLE PROTECTION FOR /ADMIN
  if (user && pathname.startsWith('/admin') && !pathname.startsWith('/result')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const staffRoles = ['admin', 'editor', 'administration', 'prof']
    if (!profile || !staffRoles.includes(profile.role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/student'
      // FIX: Merge cookies from supabaseResponse into the redirect response
      return NextResponse.redirect(url, { headers: supabaseResponse.headers })
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|image).*)',
  ],
}
