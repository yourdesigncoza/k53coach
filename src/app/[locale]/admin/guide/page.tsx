import { Link } from "@/i18n/navigation";
import {
  ChevronLeft,
  Signpost,
  FileQuestion,
  Languages,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Admin · Guide" };

/**
 * At-a-glance how-to for the site administrator (Lawrence). Kept short and
 * scannable — the process flow for managing signs, questions, translations and
 * access, plus the rules that decide what learners actually see.
 */
export default function AdminGuidePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-6 md:px-8 md:py-10">
      <Link
        href="/admin"
        className="-ml-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Admin home
      </Link>

      <h1 className="mt-2 text-2xl font-semibold md:text-3xl">Admin guide</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        A quick reference for running K53 Coach — how to add and update content,
        and what makes it show up for learners. Everything you change here goes
        live immediately; there is no publish or deploy step.
      </p>

      {/* The one rule that governs everything */}
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="text-sm">
          <p className="font-semibold">The golden rule: only approved content is shown.</p>
          <p className="mt-1 text-muted-foreground">
            Anything left as a <strong>draft</strong> stays hidden from learners.
            When a sign or question is correct and ready, set its status to{" "}
            <strong>approved</strong> — that is what puts it in the app. Accuracy
            comes first: check against the official K53 material before approving,
            and never invent a rule or penalty.
          </p>
        </div>
      </div>

      {/* Where things live */}
      <h2 className="mt-9 text-lg font-semibold">What you can manage</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <GuideCard
          icon={Signpost}
          title="Road signs"
          href="/admin/sign-review"
          body="Edit the meaning, behaviour and tips for every road sign, and control which signs learners see."
        />
        <GuideCard
          icon={FileQuestion}
          title="Question bank"
          href="/admin/questions"
          body="Add and edit the questions used in the free test, practice and the mock exam — grouped by section."
        />
        <GuideCard
          icon={Languages}
          title="Translations"
          href="/admin/translations"
          body="Edit the English wording and the Afrikaans of every on-screen label."
        />
        <GuideCard
          icon={KeyRound}
          title="Access (entitlements)"
          href="/admin/entitlements"
          body="Give a learner full paid access by email, or take it away."
        />
      </div>

      {/* Road signs */}
      <Section title="Road signs">
        <p>
          Open <Crumb>Road signs</Crumb> from the admin home, browse by category,
          and click any sign to edit it.
        </p>
        <Steps>
          <li>
            <strong>Content.</strong> Fill in the plain-English meaning, the
            formal meaning, the driver behaviour, the common mistake and the test
            hint — in English and Afrikaans. The <strong>AI draft</strong> button
            writes a first version you can correct; it never invents law, so
            always read it before saving.
          </li>
          <li>
            <strong>To show a sign to learners</strong>, three things must all be
            set: <em>SA-relevant</em> = “Yes — in official chart”,{" "}
            <em>asset status</em> = <strong>approved</strong>, and{" "}
            <em>review status</em> = <strong>approved</strong>. Miss any one and
            the sign stays hidden.
          </li>
          <li>
            <strong>To hide / exclude a sign</strong> that is not part of the SA
            test, set <em>SA-relevant</em> = “No — exclude from learners”.
          </li>
        </Steps>
        <Note>
          The <strong>exceptions queue</strong> on the admin home lists signs the
          automatic check wasn’t sure about. Those are the ones that need your
          eyes — work through that list first.
        </Note>
      </Section>

      {/* Questions */}
      <Section title="Questions (the question bank)">
        <p>
          Open <Crumb>Question bank</Crumb>. The tabs at the top split questions
          into the three sections — <strong>Road Signs</strong>,{" "}
          <strong>Rules of the Road</strong> and{" "}
          <strong>Vehicle Controls</strong>. The coloured strip shows whether each
          section has enough questions to build a full mock exam (green = enough,
          amber = add more).
        </p>
        <Steps>
          <li>
            <strong>Add a question.</strong> Pick the section tab, click{" "}
            <strong>Add question</strong>, then fill in the prompt, the answer
            options (tick the correct one), and a short explanation of why it’s
            right. Set the difficulty. <strong>AI draft</strong> can write a
            starting point for you to check.
          </li>
          <li>
            <strong>Where it appears.</strong> Two switches decide this:{" "}
            <em>“Include in the free readiness test”</em> puts it in the free
            5-question test, and <em>“Include in the mock exam pool”</em> puts it
            in the paid mock exam (with a likelihood weight and the vehicle codes
            it applies to). A question can be in both, one, or neither.
          </li>
          <li>
            <strong>Attach a sign (optional).</strong> Enter a sign code to show
            that sign’s picture with the question — it must be an approved sign.
          </li>
          <li>
            <strong>Go live.</strong> Set review status to{" "}
            <strong>approved</strong> and Save. Drafts are never shown.
          </li>
        </Steps>
      </Section>

      {/* Translations */}
      <Section title="Translations (English & Afrikaans)">
        <p>
          Open <Crumb>Translations</Crumb> to edit the wording of any on-screen
          label. Each entry has the English text beside its Afrikaans; edit
          either, and <strong>AI draft</strong> can suggest the Afrikaans. Saved
          changes appear in the app straight away. (This covers interface labels —
          the sign and question wording is edited in their own screens above.)
        </p>
      </Section>

      {/* Access */}
      <Section title="Giving a learner paid access">
        <p>
          Open <Crumb>Access (entitlements)</Crumb>. Type the learner’s email and
          click <strong>Grant access</strong> — they get 90 days of full access
          (mock exams, AI coaching, everything). You can <strong>revoke</strong> a
          grant at any time. Use this to unlock accounts until card payment is
          switched on.
        </p>
      </Section>

      {/* Recap */}
      <h2 className="mt-9 text-lg font-semibold">Quick recap</h2>
      <ul className="mt-3 flex flex-col gap-2 text-sm">
        {[
          "Draft = hidden. Approved = live. That switch is what publishes content.",
          "A sign needs SA-relevant + asset approved + review approved to be seen.",
          "A question needs approved status, plus the right “readiness” / “exam” switch to appear where you want it.",
          "Everything you save is live immediately — no deploy needed.",
          "When unsure, check the official K53 material before approving. Never guess.",
        ].map((line) => (
          <li key={line} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GuideCard({
  icon: Icon,
  title,
  body,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Card className="py-0">
      <CardContent className="py-0">
        <Link href={href} className="flex items-start gap-3 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
            <Icon className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-medium">{title}</span>
            <span className="block text-sm text-muted-foreground">{body}</span>
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_em]:not-italic [&_em]:font-medium [&_em]:text-foreground">
        {children}
      </div>
    </section>
  );
}

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="ml-4 list-decimal space-y-2 marker:text-muted-foreground">{children}</ol>;
}

function Crumb({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium text-foreground">
      {children}
    </span>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground [&_strong]:text-foreground">
      {children}
    </div>
  );
}
