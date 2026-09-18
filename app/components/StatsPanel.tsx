"use client";

import type { Contribution, Profile, RangeKey } from "@/lib/types";
import { RANGE_OPTIONS } from "@/lib/types";
import { GitHubIcon } from "./icons";
import { Button, Label, Panel } from "./ui";

type Props = {
  username: string;
  profile: Profile | null;
  total: number;
  best: Contribution | null;
  range: RangeKey;
  metricsHidden: boolean;
  onToggleMetrics: () => void;
};

export default function StatsPanel({
  username,
  profile,
  total,
  best,
  range,
  metricsHidden,
  onToggleMetrics,
}: Props) {
  const rangeLabel =
    RANGE_OPTIONS.find((r) => r.value === range)?.label ?? "Past year";

  return (
    <aside className="pointer-events-auto flex w-64 flex-col gap-3 sm:w-72 sm:gap-4">
      <Panel className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4 shadow-none">
        {profile?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt=""
            width={48}
            height={48}
            className="h-9 w-9 shrink-0 border-2 border-(--ui-border) object-cover sm:h-12 sm:w-12"
          />
        ) : (
          <div
            aria-hidden="true"
            className="h-9 w-9 shrink-0 border-2 border-(--ui-border) bg-(--ui-hover) sm:h-12 sm:w-12"
          />
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug font-bold text-(--ui-fg)">
            {username}&rsquo;s Forest
          </p>
          <a
            href={profile?.profileUrl ?? `https://github.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="brut-theme mt-1 inline-flex cursor-pointer items-center gap-2 text-xs text-(--ui-fg-muted) hover:text-(--ui-fg)"
          >
            <GitHubIcon className="h-3 w-3" />
            Visit profile
          </a>
        </div>
      </Panel>
      {metricsHidden && (
        <Button
          type="button"
          onClick={onToggleMetrics}
          aria-pressed={false}
          className="!text-[10px] tracking-wider !py-1.5 !px-3 self-start"
        >
          Show metrics
        </Button>
      )}
      {!metricsHidden && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Stat
              label="Repositories"
              value={profile ? profile.publicRepos.toLocaleString() : "—"}
            />
            <Stat
              label="Followers"
              value={profile ? compact(profile.followers) : "—"}
            />
          </div>
          <Panel className="p-3 sm:p-4 shadow-none">
            <Label>Top languages</Label>
            {profile?.topLanguages.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                {profile.topLanguages.map((language) => (
                  <span
                    key={language}
                    className="brut-theme border-2 border-(--ui-border) px-1.5 py-0.5 text-xs font-medium text-(--ui-fg) sm:px-2 sm:py-1"
                  >
                    {language}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-(--ui-fg-muted)">Not available</p>
            )}
          </Panel>
          <Button
            type="button"
            onClick={onToggleMetrics}
            aria-pressed={true}
            className="!text-[10px] tracking-wider !py-1.5 !px-3 self-start"
          >
            Hide metrics
          </Button>
        </>
      )}
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
    <Panel className="p-3 sm:p-4 shadow-none">
      <Label>{label}</Label>
      <p className="mt-1.5 text-base font-bold tabular-nums text-(--ui-fg) sm:mt-2 sm:text-xl">
        {value}
      </p>
      {note && (
        <Label className="mt-1 truncate font-normal tracking-wide">{note}</Label>
      )}
    </Panel>
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
