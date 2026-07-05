"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient, supabaseEnvReady } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Right-hand actions in the marketing header. Auth-aware so a signed-in learner
 * isn't shown "Log in" (which reads as "you're logged out"): once resolved to a
 * session it swaps to a single "Go to app" button. While resolving, and when
 * signed out, it shows the default Log in / Start free pair — that's also the
 * SSR output, so there's no missing-button flash for the common visitor.
 */
export function HeaderAuthActions() {
  const t = useTranslations("landing");
  const [email, setEmail] = useState<string | null | undefined>(
    supabaseEnvReady ? undefined : null,
  );

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return; // demo mode — stays signed out
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setEmail(session?.user?.email ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (email) {
    return (
      <Button
        size="sm"
        className="h-9 rounded-[14px] px-4 font-display font-semibold"
        render={
          <Link href="/dashboard">
            {t("goToApp")} <ArrowRight className="size-4" />
          </Link>
        }
      />
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="hidden text-ivory hover:text-gold-300 sm:inline-flex"
        render={<Link href="/auth">{t("login")}</Link>}
      />
      <Button
        size="sm"
        className="h-9 rounded-[14px] px-4 font-display font-semibold"
        render={<Link href="/readiness">{t("startFree")}</Link>}
      />
    </>
  );
}
