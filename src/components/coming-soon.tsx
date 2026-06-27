import Link from "next/link";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Honest placeholder for features deferred past the MVP slice (overview §14). */
export function ComingSoon({
  title,
  blurb,
}: {
  title: string;
  blurb: string;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-5 py-10">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <Construction className="size-7" />
          </span>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{blurb}</p>
          <Button
            variant="outline"
            className="mt-2 rounded-xl"
            render={<Link href="/learn">Back to learning</Link>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
