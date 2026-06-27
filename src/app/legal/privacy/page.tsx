import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata = { title: "Privacy & POPIA" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 pb-16">
      <header className="pt-safe py-5">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>
      </header>

      <article className="prose-sm flex flex-col gap-4 text-sm leading-relaxed">
        <h1 className="text-2xl font-bold">Privacy &amp; POPIA</h1>
        <p className="text-muted-foreground">
          Placeholder notice for the MVP scaffold. The production policy is
          drafted with legal review before launch (DB12).
        </p>

        <h2 className="text-base font-semibold">Our privacy principles</h2>
        <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
          <li>The free readiness test is anonymous — no account required.</li>
          <li>
            We never collect or store biometric data. Passkey sign-in is handled
            by your own device.
          </li>
          <li>
            For learners under 18, a parent or guardian must consent before we
            save personal progress.
          </li>
          <li>We collect the minimum personal information needed.</li>
          <li>
            Production data is handled POPIA-first: SA data residency, clear
            retention rules, and encrypted storage.
          </li>
        </ul>

        <p className="text-xs text-muted-foreground">
          Required production documents: Terms, Privacy Policy, POPIA Policy,
          Parent Consent, Refund Policy, School Agreement, Cookie Policy, AI
          Usage Disclaimer.
        </p>
      </article>
    </main>
  );
}
