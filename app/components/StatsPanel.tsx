"use client";

import { useState } from "react";
import type { Contribution, Profile, RangeKey } from "@/lib/types";
import { RANGE_OPTIONS } from "@/lib/types";
import { GitHubMark } from "./Header";
import { Button, ButtonLink, Label, Panel } from "./ui";

type Props = {
  username: string;
  profile: Profile | null;
  total: number;
  best: Contribution | null;
  range: RangeKey;
};

/**
 * Metrics and actions, stacked down the right-hand side. Profile data is
 * optional: GitHub's unauthenticated API is rate limited per IP, so every row
 * that depends on it degrades rather than blocking the forest.
 */
export default function StatsPanel({
  username,
  profile,
  total,
  best,
  range,
}: Props) {
  const displayName = profile?.name || username;
  const rangeLabel =
    RANGE_OPTIONS.find((r) => r.value === range)?.label ?? "Past year";

  return (
    <aside className="pointer-events-auto flex w-full flex-col gap-4 sm:w-72">
      {/* Row 1 — identity */}
      <Panel className="flex items-center gap-4 p-4">
        {profile?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 border-2 border-(--ui-border) object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="h-12 w-12 shrink-0 border-2 border-(--ui-border) bg-(--ui-hover)"
          />
        )}

        <div className="min-w-0 flex-1">
          {/* Wraps rather than truncating: a person's name is the one thing
              here that should never be cut off. */}
          <p className="text-sm leading-snug font-bold text-(--ui-fg)">
            {displayName}&rsquo;s Forest
          </p>
          <a
            href={profile?.profileUrl ?? `https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="brut-theme mt-1 inline-flex cursor-pointer items-center gap-2 text-xs text-(--ui-fg-muted) hover:text-(--ui-fg)"
          >
            <GitHubMark className="h-3 w-3" />
            Visit profile
          </a>
        </div>
      </Panel>

      {/* Row 2 — contribution metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Stat
          label="Contributions"
          value={total.toLocaleString()}
          note={rangeLabel}
        />
        <Stat
          label="Best day"
          value={best ? best.count.toLocaleString() : "—"}
          note={best ? formatShort(best.date) : undefined}
        />
      </div>

      {/* Row 3 — profile metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Stat
          label="Repositories"
          value={profile ? profile.publicRepos.toLocaleString() : "—"}
        />
        <Stat
          label="Followers"
          value={profile ? compact(profile.followers) : "—"}
        />
      </div>

      {/* Row 4 — languages */}
      <Panel className="p-4">
        <Label>Top languages</Label>
        {profile?.topLanguages.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.topLanguages.map((language) => (
              <span
                key={language}
                className="brut-theme border-2 border-(--ui-border) px-2 py-1 text-xs font-medium text-(--ui-fg)"
              >
                {language}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-(--ui-fg-muted)">Not available</p>
        )}
      </Panel>

      {/* Row 5 — actions */}
      <div className="flex gap-4">
        <ShareButton />
        <ButtonLink href="/" className="flex-1">
          Grow another
        </ButtonLink>
      </div>
    </aside>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <Panel className="p-4">
      <Label>{label}</Label>
      <p className="mt-2 text-xl font-bold tabular-nums text-(--ui-fg)">
        {value}
      </p>
      {note && (
        <Label className="mt-1 truncate font-normal tracking-wide">
          {note}
        </Label>
      )}
    </Panel>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked (insecure context, denied permission); the URL
      // is in the address bar either way, so this is not worth an error state.
    }
  }

  return (
    <Button type="button" onClick={share} className="flex-1">
      {copied ? "Copied" : "Share"}
    </Button>
  );
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function formatShort(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
