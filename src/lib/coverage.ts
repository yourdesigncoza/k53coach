import chartAuthority from "../../data/chart-authority.json";
import type { SignRow } from "./signs";

/** A code from the official DoT chart (data/chart-authority.json). */
type ChartCode = { code: string; name: string | null };

/**
 * Coverage of the official chart (init/RTSigns_charts.pdf) by what we have in the
 * DB. A chart code counts as covered if we hold it exactly OR any parametric
 * variant of it (e.g. chart `R201` is covered by `R201-60`). "Core" = the
 * learner-facing R/W/IN codes, excluding road markings and temporary signs.
 */
export function chartCoverage(signs: Pick<SignRow, "code">[]) {
  const chart = chartAuthority as ChartCode[];
  const dbCodes = signs.map((s) => s.code);
  const core = chart.filter((c) => /^(R|W|IN)\d/.test(c.code));
  const missing = core.filter(
    (c) => !dbCodes.some((d) => d === c.code || d.startsWith(c.code + "-")),
  );
  return {
    total: chart.length,
    core: core.length,
    covered: core.length - missing.length,
    missing,
  };
}
