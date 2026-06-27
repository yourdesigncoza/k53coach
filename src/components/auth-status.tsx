"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shows the signed-in email + sign-out, or a Log in link. Reflects live auth. */
export function AuthStatus({ className }: { className?: string }) {
  const t = useTranslations("common");
  const router = useRouter();
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setEmail(null);
      return;
    }
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
    <div className={cn("flex min-w-0 items-center gap-1", className)}>
      <span className="truncate text-xs text-muted-foreground">{email}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={signOut}
        aria-label="Sign out"
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
