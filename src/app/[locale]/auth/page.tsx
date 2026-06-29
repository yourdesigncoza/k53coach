"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { GlobalHeader } from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, supabaseEnvReady } from "@/lib/supabase/client";

export default function AuthPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    const supabase = createClient();
    if (!supabase) {
      toast.info(t("demoSkip"));
      setBusy(false);
      router.push("/dashboard");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success(t("magicSent"));
  }

  return (
    <>
      <GlobalHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <Card>
        <CardContent className="py-6">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

          <form onSubmit={sendMagicLink} className="mt-5 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="h-12 w-full rounded-xl text-base"
            >
              <Mail className="size-4" /> {t("magic")}
            </Button>
          </form>

          {!supabaseEnvReady && (
            <p className="mt-4 rounded-lg bg-accent/60 p-3 text-xs text-accent-foreground">
              {t("demoNote")}
            </p>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {t("minor")}{" "}
        <Link href="/legal/privacy" className="underline">
          {t("learnMore")}
        </Link>
      </p>
      </main>
    </>
  );
}
