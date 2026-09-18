export type Level = 0 | 1 | 2 | 3 | 4;

export type Contribution = {
  date: string;
  count: number;
  level: Level;
};

export type ContributionsResponse = {
  total: Record<string, number>;
  contributions: Contribution[];
};

export type TimeOfDay = "day" | "night";

export type LayoutMode = "github" | 2 | 3 | 4;

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

export type Profile = {
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
  publicRepos: number;
  followers: number;
  topLanguages: string[];
};
