import type { Profile } from "./types";

const GITHUB_API = "https://api.github.com";
const TIMEOUT_MS = 6000;

export async function fetchProfile(username: string): Promise<Profile | null> {
  try {
    const res = await fetch(`${GITHUB_API}/users/${encodeURIComponent(username)}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const user = (await res.json()) as {
      login?: string;
      name?: string | null;
      avatar_url?: string;
      html_url?: string;
      public_repos?: number;
      followers?: number;
    };
    if (!user?.login) return null;

    return {
      login: user.login,
      name: user.name ?? null,
      avatarUrl: user.avatar_url ?? "",
      profileUrl: user.html_url ?? `https://github.com/${user.login}`,
      publicRepos: user.public_repos ?? 0,
      followers: user.followers ?? 0,
      topLanguages: await fetchTopLanguages(username),
    };
  } catch {
    return null;
  }
}

async function fetchTopLanguages(username: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`,
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!res.ok) return [];

    const repos = (await res.json()) as {
      language?: string | null;
      fork?: boolean;
    }[];
    if (!Array.isArray(repos)) return [];

    const counts = new Map<string, number>();
    for (const repo of repos) {
      if (repo.fork || !repo.language) continue;
      counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([language]) => language);
  } catch {
    return [];
  }
}
