import { useTranslations } from "next-intl";
import { GlobalHeader } from "@/components/global-header";

export const metadata = { title: "Privacy & POPIA" };

export default function PrivacyPage() {
  const t = useTranslations("legal");
  const principles = [t("p1"), t("p2"), t("p3"), t("p4"), t("p5")];

  return (
    <>
      <GlobalHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-16 pt-5">
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
    </>
  );
}
