import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_RETURN_COOKIE } from "@/lib/auth/return-path";
import { createClient } from "@/lib/supabase/server";

function resolveReturnPath(queryNext: string | null): string {
  if (queryNext?.startsWith("/")) return queryNext;

  const cookieNext = cookies().get(AUTH_RETURN_COOKIE)?.value;
  if (cookieNext) {
    try {
      const decoded = decodeURIComponent(cookieNext);
      if (decoded.startsWith("/")) return decoded;
    } catch {
      // ignore malformed cookie values
    }
  }

  return "/";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = resolveReturnPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const destination = `${origin}${next}`;
      const response = NextResponse.redirect(destination);
      response.cookies.set(AUTH_RETURN_COOKIE, "", { path: "/", maxAge: 0 });
      return response;
    }
  }

  const response = NextResponse.redirect(`${origin}/`);
  response.cookies.set(AUTH_RETURN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
