import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do not remove this await
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes — redirect unauthenticated users to /signup.
  // /review is intentionally PUBLIC — never redirect it.
  const { pathname } = request.nextUrl;

  // Explicit public-route allowlist — these are NEVER redirected.
  const publicPaths = ["/review", "/search", "/building", "/landlord", "/about", "/how-it-works", "/pricing", "/"];
  const isExplicitlyPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p + "?")
  );

  const protectedPaths = ["/account"];
  const isProtected = !isExplicitlyPublic && protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  console.log(`[middleware] pathname=${pathname} user=${user?.id ?? "none"} isExplicitlyPublic=${isExplicitlyPublic} isProtected=${isProtected}`);

  if (isProtected && !user) {
    console.log(`[middleware] REDIRECTING ${pathname} → /signup`);
    const url = request.nextUrl.clone();
    url.pathname = "/signup";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
