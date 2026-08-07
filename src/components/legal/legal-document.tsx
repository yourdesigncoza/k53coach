import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { LegalBlock, LegalDoc, LegalSection } from "@/lib/types";
import { OPERATOR } from "@/content/legal/operator";

/**
 * Renders a published legal document — the Terms, the Privacy Policy, and the
 * refund extract pulled out of the Terms.
 *
 * One renderer for all three deliberately: these documents are published
 * verbatim (docs/legal/README.md), and a second renderer is how one of them
 * quietly starts looking — and then reading — different from the others.
 *
 * The prose comes from src/content/legal/*, never from messages/*.json. Only
 * the chrome around it (the effective-date label, the PDF link) is translated.
 */

function Blocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <div key={i} className="flex flex-col gap-2">
          {block.subheading && (
            <h3 className="font-semibold text-foreground">{block.subheading}</h3>
          )}
          {block.text?.map((p) => (
            <p key={p} className="text-muted-foreground">
              {p}
            </p>
          ))}
          {block.lines && (
            <p className="text-muted-foreground">
              {block.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          )}
          {block.bullets && (
            <ul className="ml-4 list-disc space-y-1.5 text-muted-foreground">
              {block.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </>
  );
}

export function LegalDocument({
  doc,
  /** Render only these clauses, in this order — how /legal/refund extracts the
   *  refund policy from the Terms without a second copy of the text. */
  only,
  /** Overrides the document title (the refund extract is not the whole Terms). */
  title,
  /** Chrome shown under the title, e.g. the link back to the full Terms. */
  note,
}: {
  doc: LegalDoc;
  only?: readonly string[];
  title?: string;
  note?: ReactNode;
}) {
  const t = useTranslations("legal");
  const isExtract = only !== undefined;
  const sections: LegalSection[] = isExtract
    ? only.flatMap((id) => doc.sections.filter((s) => s.id === id))
    : doc.sections;

  return (
    <article className="flex flex-col gap-6 text-sm leading-relaxed">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          K53 Coach
        </p>
        <h1 className="text-2xl font-bold">{title ?? doc.title}</h1>
        <p className="text-xs text-muted-foreground">
          <span className="block">
            {t("effectiveDate", { date: doc.effectiveDate })}
          </span>
          <span className="block">Website: {OPERATOR.website}</span>
        </p>
        {note}
        <a
          href={doc.pdf}
          className="text-gold-ink w-fit text-xs font-medium underline"
        >
          {t("downloadPdf")}
        </a>
      </header>

      {/* The preamble introduces the whole agreement, so it stays off an extract. */}
      {!isExtract && (
        <div className="flex flex-col gap-3">
          <Blocks blocks={doc.intro} />
        </div>
      )}

      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          /* The site header is sticky, so an anchored clause needs headroom. */
          className="flex scroll-mt-24 flex-col gap-3"
        >
          <h2 className="text-base font-semibold">
            {section.number}. {section.heading}
          </h2>
          <Blocks blocks={section.blocks} />
        </section>
      ))}

      {/* Clauses added after the document was supplied. Published under their own
          numbers after the supplied ones, and left off an extract for the same
          reason the preamble is. */}
      {!isExtract &&
        doc.amendments?.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="flex scroll-mt-24 flex-col gap-3"
          >
            <h2 className="text-base font-semibold">
              {section.number}. {section.heading}
            </h2>
            <Blocks blocks={section.blocks} />
          </section>
        ))}

      {doc.callout && (
        <aside className="flex flex-col gap-3 rounded-[14px] border border-[var(--surface-border)] bg-surface-2 p-4 md:p-6">
          <h2 className="text-base font-semibold">{doc.callout.title}</h2>
          <Blocks blocks={doc.callout.blocks} />
        </aside>
      )}

      <p className="text-xs text-muted-foreground">{doc.copyright}</p>
    </article>
  );
}
