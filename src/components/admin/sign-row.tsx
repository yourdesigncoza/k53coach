import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignImage } from "@/components/sign-image";
import { signVerification, type SignRow } from "@/lib/signs";

function statusBadge(value: string, kind: "asset" | "review") {
  const approved = value === "approved";
  return (
    <Badge
      variant="secondary"
      className={
        approved
          ? "[&]:text-emerald-700 dark:[&]:text-emerald-300 bg-success/10"
          : "bg-warning/15 [&]:text-amber-700 dark:[&]:text-amber-300"
      }
    >
      {kind === "asset" ? "asset" : "content"}: {value}
    </Badge>
  );
}

/** One admin sign row → links to the editor. Shows the exclusion reason for
 *  excluded signs, otherwise the two review-gate badges. */
export function SignRowLink({ sign }: { sign: SignRow }) {
  const excluded = sign.sa_relevant === false;
  const reason = signVerification(sign)?.exclusionReason ?? null;
  return (
    <Card>
      <CardContent className="py-0">
        <Link
          href={`/admin/signs/${encodeURIComponent(sign.code)}`}
          className="flex items-center gap-3 py-2.5"
        >
          <SignImage svgFile={sign.svg_file} name={sign.name} className="size-9 shrink-0" />
          <span className="w-20 shrink-0 text-xs text-muted-foreground">{sign.code}</span>
          <span className="flex-1 truncate text-sm font-medium">{sign.name}</span>
          {excluded && reason ? (
            <span className="hidden max-w-[18rem] truncate text-xs text-muted-foreground sm:inline">
              {reason}
            </span>
          ) : null}
          {excluded ? (
            <Badge variant="outline" className="hidden sm:inline-flex">
              excluded
            </Badge>
          ) : (
            <span className="hidden gap-1.5 sm:flex">
              {statusBadge(sign.asset_status, "asset")}
              {statusBadge(sign.review_status, "review")}
            </span>
          )}
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      </CardContent>
    </Card>
  );
}
