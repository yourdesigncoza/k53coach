/**
 * Linear tracker adapter — turns a triaged `feedback_reports` row into an issue
 * in the K53 Coach workspace.
 *
 * Deliberately the ONLY place that knows Linear exists. The `Tracker` interface
 * below is the seam: swapping in Trello (or adding it alongside) means writing a
 * second module with the same two functions, not touching the feature.
 *
 * Never called from a learner's request path. Submission writes the DB row and
 * returns; an admin pushes at triage. So Linear being down or slow cannot cost a
 * learner a report — the failure mode is a button that says "push failed", on a
 * screen only an admin is looking at.
 */

import type { ReportPriority } from "@/lib/feedback";

const LINEAR_API = "https://api.linear.app/graphql";
const TEAM_KEY = "K53";
const PROJECT_NAME = "Post-MVP Roadmap";
const LABEL_NAME = "User Report";
const TIMEOUT_MS = 15_000;

export type TrackerIssue = {
  id: string;
  url: string;
  /** Human reference, e.g. "K53-41". */
  identifier: string;
};

export type TrackerPayload = {
  title: string;
  /** Plain-language block Louwrens reads. */
  clientBlock: string;
  /** Everything below the divider — paths, ids, provenance, stack traces. */
  technicalNotes: string;
  priority: ReportPriority;
  /** Extra label beyond "User Report" — "Bug" or "Feature" where it fits. */
  extraLabel?: string;
};

export interface Tracker {
  isConfigured(): boolean;
  createIssue(payload: TrackerPayload): Promise<TrackerIssue>;
}

export function hasLinearKey() {
  return Boolean(process.env.LINEAR_API_KEY);
}

/** Linear's scale: 0 none, 1 urgent, 2 high, 3 medium, 4 low. */
const PRIORITY_MAP: Record<ReportPriority, number> = {
  urgent: 1,
  high: 2,
  medium: 3,
  low: 4,
};

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const key = process.env.LINEAR_API_KEY;
  if (!key) throw new Error("LINEAR_API_KEY not set");

  const res = await fetch(LINEAR_API, {
    method: "POST",
    headers: { authorization: key, "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`Linear API ${res.status}`);
  const json = await res.json();
  // Linear returns HTTP 200 with an `errors` array for a bad mutation, so a
  // status check alone would report success on a failed create.
  if (json.errors?.length) {
    throw new Error(`Linear: ${json.errors[0]?.message ?? "unknown error"}`);
  }
  return json.data as T;
}

type Ids = { teamId: string; projectId: string | null; labelIds: string[] };

/**
 * Resolve team/project/label by NAME rather than pinning ids in env.
 *
 * Names are what a human sees and renames; ids are what the API needs. Looking
 * them up each push costs one request and means renaming the project in Linear's
 * UI doesn't silently break pushes — which is exactly the kind of breakage
 * nobody notices until the queue has quietly stopped draining.
 */
async function resolveIds(extraLabel?: string): Promise<Ids> {
  const data = await gql<{
    teams: {
      nodes: Array<{
        id: string;
        key: string;
        labels: { nodes: Array<{ id: string; name: string }> };
        projects: { nodes: Array<{ id: string; name: string }> };
      }>;
    };
  }>(`{
    teams {
      nodes {
        id
        key
        labels { nodes { id name } }
        projects { nodes { id name } }
      }
    }
  }`);

  const team = data.teams.nodes.find((t) => t.key === TEAM_KEY);
  if (!team) throw new Error(`Linear team ${TEAM_KEY} not found`);

  const project = team.projects.nodes.find((p) => p.name === PROJECT_NAME);

  const wanted = [LABEL_NAME, ...(extraLabel ? [extraLabel] : [])];
  const labelIds = wanted
    .map((name) => team.labels.nodes.find((l) => l.name === name)?.id)
    .filter((id): id is string => Boolean(id));

  return { teamId: team.id, projectId: project?.id ?? null, labelIds };
}

/**
 * Issue body in the house format: a plain client block on top, a divider, then
 * technical detail. Louwrens reads these, so infrastructure detail never goes
 * above the line.
 */
export function buildIssueBody(payload: TrackerPayload): string {
  return [
    payload.clientBlock.trim(),
    "",
    "---",
    "",
    "### Technical notes (dev team)",
    "",
    payload.technicalNotes.trim(),
  ].join("\n");
}

export const linearTracker: Tracker = {
  isConfigured: hasLinearKey,

  async createIssue(payload: TrackerPayload): Promise<TrackerIssue> {
    const { teamId, projectId, labelIds } = await resolveIds(payload.extraLabel);

    const data = await gql<{
      issueCreate: {
        success: boolean;
        issue: { id: string; url: string; identifier: string } | null;
      };
    }>(
      `mutation Create($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { id url identifier }
        }
      }`,
      {
        input: {
          teamId,
          title: payload.title,
          description: buildIssueBody(payload),
          priority: PRIORITY_MAP[payload.priority] ?? 3,
          ...(projectId ? { projectId } : {}),
          ...(labelIds.length ? { labelIds } : {}),
        },
      },
    );

    if (!data.issueCreate?.success || !data.issueCreate.issue) {
      throw new Error("Linear issueCreate returned no issue");
    }
    return data.issueCreate.issue;
  },
};
