import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/profile/settings";

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Magic link expired, already used, or otherwise invalid.
      // Redirect to settings with a flag the UI can surface.
      return NextResponse.redirect(
        new URL(`${next}?authError=invalid`, url.origin),
      );
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}