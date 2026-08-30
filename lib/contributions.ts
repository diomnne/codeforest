import { rngFromSeed } from "./random";
import type { Contribution, ContributionsResponse, Level } from "./types";

const API_BASE = "https://github-contributions-api.jogruber.de/v4";

export type FetchResult =
  | { ok: true; contributions: Contribution[]; total: number; mock: boolean }
  | { ok: false; reason: "not-found" }
  | { ok: false; reason: "error"; message: string };

/**
 * `?y=last` is required: the API defaults to y=all, which returns every year the
 * account has existed. `revalidate: 3600` matches the API's own one-hour cache,
 * so we don't layer a second cache on top of it.
 */
export async function fetchContributions(
  username: string,
): Promise<FetchResult> {
  let res: Response;
  try {
    res = await fetch(
      `${API_BASE}/${encodeURIComponent(username)}?y=last`,
      { next: { revalidate: 3600 } },
    );
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message: err instanceof Error ? err.message : "Network request failed",
    };
  }

  if (res.status === 404) return { ok: false, reason: "not-found" };
  if (!res.ok) {
    return {
      ok: false,
      reason: "error",
      message: `Contributions API responded ${res.status}`,
    };
  }

  let json: ContributionsResponse;
  try {
    json = (await res.json()) as ContributionsResponse;
  } catch {
    return { ok: false, reason: "error", message: "Malformed API response" };
  }

  const contributions = Array.isArray(json?.contributions)
    ? json.contributions
    : [];

  // The API answers 200 with an empty set for some non-existent users.
  if (contributions.length === 0) return { ok: false, reason: "not-found" };

  return {
    ok: true,
    contributions,
    total: sumCounts(contributions),
    mock: false,
  };
}

function sumCounts(contributions: Contribution[]): number {
  return contributions.reduce((acc, c) => acc + c.count, 0);
}

/**
 * Seeded stand-in for the API, in the exact same per-day shape. Lets the scene
 * be developed and demoed with the API unreachable or rate-limited (`?mock=1`).
 */
export function mockContributions(username: string): FetchResult {
  const rng = rngFromSeed(`mock:${username}`);
  const contributions: Contribution[] = [];

  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCFullYear(start.getUTCFullYear() - 1);
  start.setUTCDate(start.getUTCDate() + 1);

  const counts: number[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.getUTCDay();
    // Weekends are quieter, and a slow seasonal swell keeps beds from looking uniform.
    const weekend = day === 0 || day === 6 ? 0.35 : 1;
    const seasonal =
      0.6 + 0.4 * Math.sin((d.getUTCMonth() / 12) * Math.PI * 2 + 1.2);
    const roll = rng();
    const count =
      roll < 0.25 * (2 - weekend)
        ? 0
        : Math.round(rng() * 12 * weekend * seasonal + rng() * 3);

    counts.push(count);
    contributions.push({
      date: d.toISOString().slice(0, 10),
      count,
      level: 0, // assigned below, once the distribution is known
    });
  }

  const levels = quartileLevels(counts);
  contributions.forEach((c, i) => {
    c.level = levels[i];
  });

  return {
    ok: true,
    contributions,
    total: sumCounts(contributions),
    mock: true,
  };
}

/**
 * Mirrors GitHub's own scheme: level is a per-user relative quartile of the
 * non-zero days, not an absolute count. That's what keeps a quiet year from
 * rendering as an empty field.
 */
function quartileLevels(counts: number[]): Level[] {
  const nonZero = counts.filter((c) => c > 0).sort((a, b) => a - b);
  if (nonZero.length === 0) return counts.map(() => 0 as Level);

  const at = (q: number) =>
    nonZero[Math.min(nonZero.length - 1, Math.floor(nonZero.length * q))];
  const q1 = at(0.25);
  const q2 = at(0.5);
  const q3 = at(0.75);

  return counts.map((c) => {
    if (c <= 0) return 0;
    if (c <= q1) return 1;
    if (c <= q2) return 2;
    if (c <= q3) return 3;
    return 4;
  });
}
