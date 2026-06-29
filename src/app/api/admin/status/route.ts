import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/supabase/queries";

/**
 * Lightweight admin-status probe for client nav (AdminNavLink). Uses the
 * server-side `isAdmin()` (cookie session + `public.is_admin()`), so the client
 * never needs the Supabase SDK. Returns `{ isAdmin: boolean }`.
 */
export async function GET() {
  return NextResponse.json({ isAdmin: await isAdmin() });
}
