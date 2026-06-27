import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";

export const metadata = { title: "Privacy & POPIA" };

export default function PrivacyPage() {
  const t = useTranslations("legal");
  const principles = [t("p1"), t("p2"), t("p3"), t("p4"), t("p5")];

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 pb-16">
      <header className="pt-safe py-5">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>
      </header>

      <article className="prose-sm flex flex-col gap-4 text-sm leading-relaxed">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>

        <h2 className="text-base font-semibold">{t("principlesTitle")}</h2>
        <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
          {principles.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground">{t("docs")}</p>
      </article>
    </main>
  );
}
