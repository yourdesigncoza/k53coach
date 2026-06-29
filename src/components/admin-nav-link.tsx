"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * An "Admin" nav link that renders ONLY for admins. Asks the server
 * (`/api/admin/status`, which runs `isAdmin()` against the cookie session) so it
 * works without the Supabase browser SDK. Renders nothing otherwise.
 */
export function AdminNavLink({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/status")
      .then((r) => (r.ok ? r.json() : { isAdmin: false }))
      .then((d) => {
        if (active) setIsAdmin(Boolean(d.isAdmin));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      render={
        <Link href="/admin">
          <ShieldCheck className="size-4" />
          {t("admin")}
        </Link>
      }
    />
  );
}
