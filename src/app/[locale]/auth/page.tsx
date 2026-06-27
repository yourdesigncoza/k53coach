"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { Fingerprint, Mail } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>

      <Card>
        <CardContent className="py-6">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

          {/* Passkey-ready: device-native auth, no biometric data stored. */}
          <Button
            variant="outline"
            className="mt-5 h-12 w-full rounded-xl text-base"
            onClick={() => toast.info(t("passkeyToast"))}
          >
            <Fingerprint className="size-4" /> {t("passkey")}
          </Button>

          <div className="my-5 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{t("or")}</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
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
  );
}
