import { type NextRequest, NextResponse } from "next/server";

import { resolveWarehouseRole } from "@/lib/auth/roles";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PREFIXES = ["/login"];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function forwardCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie.name, cookie.value);
  }
  return to;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { response, user, supabase } = await updateSession(request);

  if (user) {
    const role = await resolveWarehouseRole(supabase, user);

    if (!role) {
      await supabase.auth.signOut();

      if (!isPublicPath(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "forbidden");
        const redirect = NextResponse.redirect(url);
        return forwardCookies(response, redirect);
      }

      return response;
    }

    if (pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      const redirect = NextResponse.redirect(url);
      return forwardCookies(response, redirect);
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      const redirect = NextResponse.redirect(url);
      return forwardCookies(response, redirect);
    }

    return response;
  }

  if (!isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (pathname && pathname !== "/") {
      url.searchParams.set("next", pathname);
    }
    const redirect = NextResponse.redirect(url);
    return forwardCookies(response, redirect);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
