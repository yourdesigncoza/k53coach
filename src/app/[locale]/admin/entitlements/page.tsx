import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";
import {
  EntitlementManager,
  type EntitlementRow,
} from "@/components/admin/entitlement-manager";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Admin · Entitlements" };

export default async function AdminEntitlementsPage() {
  const supabase = await createClient();
  const { data: grants } = (await supabase
    ?.from("entitlements")
    .select("id, user_id, source, granted_at, expires_at, reference")
    .order("granted_at", { ascending: false })) ?? { data: [] };

  // Resolve user ids → emails via the Auth admin API (best-effort; null if the
  // service-role key is absent).
  const emails = new Map<string, string>();
  const admin = createAdminClient();
  if (admin && grants && grants.length > 0) {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of data?.users ?? []) if (u.email) emails.set(u.id, u.email);
  }

  const rows: EntitlementRow[] = (grants ?? []).map((g) => ({
    id: g.id,
    email: emails.get(g.user_id) ?? null,
    source: g.source,
    granted_at: g.granted_at,
    expires_at: g.expires_at,
    reference: g.reference,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-6 md:px-8 md:py-8">
      <Link
        href="/admin"
        className="-ml-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Admin
      </Link>
      <h1 className="mt-2 text-xl font-semibold md:text-2xl">Entitlements</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Paid access grants. Grant a learner 90 days of full access by email
        (used until PayFast/Yoco webhooks write these rows automatically). The
        mock exam and other paid areas check for an active grant.
      </p>
      <EntitlementManager rows={rows} />
    </div>
  );
}
