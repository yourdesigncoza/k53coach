import { notFound } from "next/navigation";
import { Bug, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { isAdmin, getUntriagedReportCount } from "@/lib/supabase/queries";

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

  const untriaged = await getUntriagedReportCount();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Home">
              <Logo showWord={false} />
            </Link>
            <Link href="/admin" className="text-sm font-semibold hover:text-foreground">
              Admin Home
            </Link>
          </div>
          <div className="flex items-center gap-5">
            {/* On every admin page, not just the index: an untriaged report is
                time-sensitive (a mis-keyed answer teaches the wrong thing every
                hour it stands), and a queue you have to go looking for is one
                that stops being drained. */}
            <Link
              href="/admin/feedback"
              className="flex items-center gap-1.5 text-sm font-medium hover:text-foreground"
            >
              <Bug className="size-4" />
              Bug Reports
              {untriaged > 0 && (
                <span className="grid min-w-5 place-items-center rounded-full bg-[var(--destructive)] px-1.5 text-[11px] leading-5 font-semibold text-white">
                  {untriaged}
                </span>
              )}
            </Link>
            <Link
              href="/admin/coach"
              className="flex items-center gap-1.5 text-sm font-medium hover:text-foreground"
            >
              <MessageCircle className="size-4" />
              Ask Coach
            </Link>
            <Link href="/admin/guide" className="text-sm font-medium hover:text-foreground">
              Guide
            </Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground underline">
              App Home
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
