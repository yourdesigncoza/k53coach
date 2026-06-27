import Link from "next/link";
import { Signpost, Route, Gauge, ArrowRight, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROAD_SIGNS } from "@/content/road-signs";

export const metadata = { title: "Learn" };

const MODULES = [
  {
    href: "/learn/road-signs",
    icon: Signpost,
    title: "Road Signs",
    sub: `${ROAD_SIGNS.length} signs available`,
    ready: true,
  },
  {
    href: "/learn/rules",
    icon: Route,
    title: "Rules of the Road",
    sub: "Coming soon",
    ready: false,
  },
  {
    href: "/learn/controls",
    icon: Gauge,
    title: "Vehicle Controls",
    sub: "Coming soon",
    ready: false,
  },
];

export default function LearnPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-xl font-semibold md:text-2xl">Learn</h1>
      <p className="text-sm text-muted-foreground">
        Three topics make up the K53 learner&apos;s test.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map(({ href, icon: Icon, title, sub, ready }) => (
          <Card key={href}>
            <CardContent className="py-0">
              <Link href={href} className="flex items-center gap-3 py-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2 font-medium">
                    {title}
                    {!ready && (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="size-3" /> soon
                      </Badge>
                    )}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {sub}
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
