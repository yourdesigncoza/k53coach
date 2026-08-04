import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuestionReviewStatus } from "@/lib/types";

/**
 * One reading of a question's lifecycle state, shared by the list and the editor
 * so the two can't drift. The colours carry the meaning that matters to a
 * reviewer scanning the queue: amber = owed to you, emerald = live, grey = a
 * decision already taken, nothing owed.
 */
const TONE: Record<QuestionReviewStatus, string> = {
  approved: "text-emerald-700 dark:text-emerald-300",
  draft: "text-amber-700 dark:text-amber-300",
  withdrawn: "text-muted-foreground line-through decoration-1",
};

export function QuestionStatusBadge({
  status,
  className,
}: {
  status: QuestionReviewStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(TONE[status], className)}>
      {status}
    </Badge>
  );
}
