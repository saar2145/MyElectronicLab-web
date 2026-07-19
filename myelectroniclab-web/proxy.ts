// Version: 1.0
// Title: Auth Session Proxy | Important Data: refreshes the Supabase auth
// session cookie on every request so server components and route handlers see a
// valid, up-to-date session. Required as soon as @supabase/ssr's browser client
// is used anywhere (register/login) - without this, sessions can silently appear
// logged-out after the access token expires. Does not gate any routes yet - it
// only keeps the cookie alive. Route protection (e.g. redirecting unauthenticated
// users away from a future /dashboard) can be added here later.

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // מרענן את ה-session אם צריך - זה גם מה שכותב מחדש את העוגייה בתגובה
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
