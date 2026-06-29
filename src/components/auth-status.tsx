"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient, supabaseEnvReady } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/** Shows a Logout button when signed in, or a Log in link otherwise. Live auth. */
export function AuthStatus({ className }: { className?: string }) {
  const t = useTranslations("common");
  const router = useRouter();
  // `undefined` = resolving; `null` = signed out (or demo mode, where there's
  // no auth, so start resolved at null and skip the effect's network calls).
  const [email, setEmail] = useState<string | null | undefined>(
    supabaseEnvReady ? undefined : null,
  );

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return; // demo mode — already resolved to null
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setEmail(session?.user?.email ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase?.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (email === undefined) return null; // still resolving

  if (!email) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={className}
        render={<Link href="/auth">{t("login")}</Link>}
      />
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={signOut}
    >
      <LogOut className="size-4" /> {t("logout")}
    </Button>
  );
}
