import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Shared chrome for the published legal documents (/legal/terms, /legal/privacy,
 * /legal/refund) — the dark storefront header and footer with a white document
 * body between them, matching every other public page.
 *
 * Wider than the app's usual column: these run to thirteen pages, and a
 * phone-width measure turns them into an endless ribbon on a laptop.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-5 pb-16 md:px-8">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
