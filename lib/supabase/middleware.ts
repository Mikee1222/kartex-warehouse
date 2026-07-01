import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

type SupabaseAuthCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

/**
 * Refreshes the Supabase session cookie on each request.
 * Call from `middleware.ts`, then branch on `user` for route protection.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{
  response: NextResponse;
  user: User | null;
  supabase: SupabaseClient;
}> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: SupabaseAuthCookie[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user, supabase };
}
