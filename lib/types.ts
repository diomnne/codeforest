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

export type Season = "summer" | "autumn";
export type LayoutMode = "ring" | "grid";
