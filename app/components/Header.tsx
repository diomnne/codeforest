"use client";

import Link from "next/link";
import type { TimeOfDay } from "@/lib/types";
import { Segmented } from "./ui";

/** Update once the repository is published. */
const REPO_URL = "https://github.com";

const TIME_OPTIONS = [
  { value: "day" as const, label: "Day" },
  { value: "night" as const, label: "Night" },
];

type Props = {
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (value: TimeOfDay) => void;
};

export default function Header({ timeOfDay, onTimeOfDayChange }: Props) {
  // z-40 keeps the header above the dialogs (z-30), so the day/night toggle and
  // repo link stay usable while the welcome or sample-data card is open.
  return (
    <header className="brut-theme absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-4 border-b-2 border-(--ui-border) bg-(--ui-surface) px-8 py-4">
      <Link
        href="/"
        className="cursor-pointer text-xl font-bold tracking-tight text-(--ui-fg) uppercase"
      >
        GitHub Forest
      </Link>

      <div className="flex items-center gap-4">
        <Segmented
          label="Time of day"
          value={timeOfDay}
          options={TIME_OPTIONS}
          onChange={onTimeOfDayChange}
        />

        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View this project on GitHub"
          className="brut brut-press flex h-10 w-10 cursor-pointer items-center justify-center text-(--ui-fg)"
        >
          <GitHubMark className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}

export function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}
