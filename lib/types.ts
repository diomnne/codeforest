export type Level = 0 | 1 | 2 | 3 | 4;

export type Contribution = {
  date: string;
  count: number;
  level: Level;
};

/** Shape returned by github-contributions-api.jogruber.de/v4 */
export type ContributionsResponse = {
  total: Record<string, number>;
  contributions: Contribution[];
};

export type TimeOfDay = "day" | "night";

/**
 * Layout the scene arranges days in. Only the GitHub strip is exposed in the
 * UI; the numeric month-panel layouts remain in the model because the morph
 * machinery is keyed by mode and they are cheap to keep available.
 */
export type LayoutMode = "github" | 2 | 3 | 4;

/** Trailing window of contribution data to show. */
export type RangeKey = "1m" | "3m" | "6m" | "1y";

export const RANGE_OPTIONS: {
  value: RangeKey;
  label: string;
  months: number;
}[] = [
  { value: "1m", label: "This month", months: 1 },
  { value: "3m", label: "3 months", months: 3 },
  { value: "6m", label: "6 months", months: 6 },
  { value: "1y", label: "Past year", months: 12 },
];

export function monthsForRange(range: RangeKey): number {
  return RANGE_OPTIONS.find((r) => r.value === range)?.months ?? 12;
}

/** Minimal GitHub profile data for the stats panel. */
export type Profile = {
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
  publicRepos: number;
  followers: number;
  topLanguages: string[];
};
