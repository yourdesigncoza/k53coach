import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { isAdmin } from "@/lib/supabase/queries";

/**
 * Admin area — content review/draft. Server-gated: only users whose profile
 * role is 'admin' get past here (RLS independently enforces admin-only writes).
 * Promote a user once they've signed in:
 *   update public.profiles set role='admin' where id='<auth-user-uuid>';
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) notFound();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-3">
            <Logo showWord={false} />
            <span className="text-sm font-semibold">Admin · Sign review</span>
          </div>
          <Link href="/dashboard" className="text-sm text-muted-foreground underline">
            Back to app
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
