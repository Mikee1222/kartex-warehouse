import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

type CookieOptions = Parameters<NextResponse["cookies"]["set"]>[2];

type SupabaseAuthCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: SupabaseAuthCookie[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components may run without mutable cookies; middleware refreshes the session.
          }
        },
      },
    },
  );
};

/** Returns the validated user from the server (JWT verified via Supabase Auth). */
export async function getServerUser(): Promise<{
  user: User | null;
  error: Error | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error: error ? new Error(error.message) : null };
}
