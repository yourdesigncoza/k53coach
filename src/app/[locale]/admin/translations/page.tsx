import { TranslationManager } from "@/components/admin/translation-manager";
import { buildCatalog } from "@/lib/translations";

export const metadata = { title: "Admin · Translations" };

export default async function AdminTranslationsPage() {
  const { rows } = await buildCatalog();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold md:text-2xl">UI translations</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Edit the English wording and its Afrikaans translation for every interface
        string. Changes go live immediately — no redeploy. Editing a field away
        from its shipped default creates an override; “Reset” restores the default.
      </p>
      <TranslationManager rows={rows} />
    </div>
  );
}
