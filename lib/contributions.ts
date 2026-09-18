import { rngFromSeed } from "./random";
import {
  monthsForRange,
  type Contribution,
  type ContributionsResponse,
  type Level,
  type RangeKey,
} from "./types";

const API_BASE = "https://github-contributions-api.jogruber.de/v4";
const REQUEST_TIMEOUT_MS = 8000;

export type FetchResult =
  | {
      ok: true;
            contributions: Contribution[];
      mock: boolean;
    }
  | { ok: false; reason: "not-found" }
  | { ok: false; reason: "error"; message: string };

export async function fetchContributions(
  username: string,
): Promise<FetchResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${encodeURIComponent(username)}?y=last`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return {
      ok: false,
      reason: "error",
      message: timedOut
        ? "The contributions API took too long to respond."
        : err instanceof Error
          ? err.message
          : "Network request failed",
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
  if (contributions.length === 0) return { ok: false, reason: "not-found" };

  return { ok: true, contributions, mock: false };
}

export function sliceRange(
  contributions: Contribution[],
  range: RangeKey,
): Contribution[] {
  const months = monthsForRange(range);
  if (months >= 12 || contributions.length === 0) return contributions;

  const last = contributions[contributions.length - 1];
  const end = new Date(`${last.date}T00:00:00Z`);

  const start = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (months - 1), 1),
  );
  const cutoff = start.toISOString().slice(0, 10);

  return contributions.filter((c) => c.date >= cutoff);
}

export function sumCounts(contributions: Contribution[]): number {
  return contributions.reduce((acc, c) => acc + c.count, 0);
}

export function bestDay(
  contributions: Contribution[],
): Contribution | null {
  let best: Contribution | null = null;
  for (const c of contributions) {
    if (!best || c.count > best.count) best = c;
  }
  return best && best.count > 0 ? best : null;
}

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

  return { ok: true, contributions, mock: true };
}

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
