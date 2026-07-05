"use client";

import { useState } from "react";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  grantEntitlement,
  revokeEntitlement,
} from "@/lib/entitlement-actions";

export type EntitlementRow = {
  id: string;
  email: string | null;
  source: string;
  granted_at: string;
  expires_at: string;
  reference: string | null;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EntitlementManager({ rows }: { rows: EntitlementRow[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  // Capture "now" once (lazy init) so the render stays pure across re-renders.
  const [now] = useState(() => Date.now());

  async function grant() {
    setBusy(true);
    const res = await grantEntitlement(email);
    setBusy(false);
    if (res.ok) {
      toast.success(`Granted 90-day access to ${email}`);
      setEmail("");
      router.refresh();
    } else {
      toast.error(res.error ?? "Grant failed");
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this entitlement?")) return;
    const res = await revokeEntitlement(id);
    if (res.ok) {
      toast.success("Revoked");
      router.refresh();
    } else {
      toast.error(res.error ?? "Revoke failed");
    }
  }

  return (
    <div className="mt-5">
      <Card>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="mb-1 block text-xs font-medium">
              Grant 90-day access by email
            </span>
            <Input
              type="email"
              placeholder="learner@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <Button onClick={grant} disabled={busy || !email.trim()} className="rounded-lg">
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Grant access
          </Button>
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-col gap-2">
        {rows.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No entitlements yet.
          </p>
        )}
        {rows.map((r) => {
          const active = new Date(r.expires_at).getTime() >= now;
          return (
            <Card key={r.id} size="sm">
              <CardContent className="flex items-center gap-3 py-2.5">
                <span className="flex flex-1 flex-col gap-1 min-w-0">
                  <span className="truncate text-sm font-medium">
                    {r.email ?? <span className="font-mono">{r.id.slice(0, 8)}</span>}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        active
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-muted-foreground",
                      )}
                    >
                      {active ? "active" : "expired"}
                    </Badge>
                    <Badge variant="secondary">{r.source}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {fmt(r.granted_at)} → {fmt(r.expires_at)}
                    </span>
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => revoke(r.id)}
                  aria-label="Revoke entitlement"
                  className="text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
