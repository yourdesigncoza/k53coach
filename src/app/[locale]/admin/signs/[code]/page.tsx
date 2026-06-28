import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignEditor } from "@/components/admin/sign-editor";
import { getSignByCode } from "@/lib/supabase/queries";
import { signContent, signVerification, chartMatch } from "@/lib/signs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const sign = await getSignByCode(decodeURIComponent(code));
  return { title: sign ? `Edit ${sign.name}` : "Edit sign" };
}

export default async function AdminSignEditPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const sign = await getSignByCode(decodeURIComponent(code));
  if (!sign) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-8">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-4 rounded-lg"
        render={
          <Link href="/admin/sign-review">
            <ArrowLeft className="size-4" /> All signs
          </Link>
        }
      />
      <SignEditor
        code={sign.code}
        name={sign.name}
        svgFile={sign.svg_file}
        category={sign.category}
        initialContent={signContent(sign)}
        initialAssetStatus={sign.asset_status}
        initialReviewStatus={sign.review_status}
        initialSaRelevant={sign.sa_relevant}
        alignment={sign.alignment}
        chartMatch={chartMatch(sign)}
        verification={signVerification(sign)}
      />
    </div>
  );
}
