import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client. For RSC, server actions, route handlers.
 * Reads/writes auth cookies via Next's `cookies()` API.
 *
 * Don't use in client components — they should use getSupabaseBrowserClient.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `set` method was called from a Server Component.
            // This happens when reading session but not setting cookies —
            // safe to ignore as long as middleware refreshes the session.
          }
        },
      },
    },
  );
}