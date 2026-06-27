"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    const supabase = createClient();
    if (!supabase) {
      toast.info("Demo mode — Supabase not configured. Skipping to the app.");
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
    else toast.success("Check your email for a magic link.");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>

      <Card>
        <CardContent className="py-6">
          <h1 className="text-xl font-semibold">Log in or sign up</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One account per learner. Parents pay; learners practise.
          </p>

          {/* Passkey-ready: device-native auth, no biometric data stored. */}
          <Button
            variant="outline"
            className="mt-5 h-12 w-full rounded-xl text-base"
            onClick={() =>
              toast.info(
                "Passkey sign-in arrives with Supabase WebAuthn. Your device handles Face ID / fingerprint — we never store biometrics.",
              )
            }
          >
            <Fingerprint className="size-4" /> Continue with a passkey
          </Button>

          <div className="my-5 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
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
              <Mail className="size-4" /> Email me a magic link
            </Button>
          </form>

          {!supabaseEnvReady && (
            <p className="mt-4 rounded-lg bg-accent/60 p-3 text-xs text-accent-foreground">
              Demo mode: Supabase isn&apos;t configured yet, so login is
              simulated. Add keys in <code>.env.local</code> to enable real auth.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Under 18? A parent or guardian must approve saving your progress.{" "}
        <Link href="/legal/privacy" className="underline">
          Learn more
        </Link>
      </p>
    </main>
  );
}
