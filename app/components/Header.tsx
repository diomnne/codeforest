"use client";

import Link from "next/link";
import type { TimeOfDay } from "@/lib/types";
import { GitHubIcon, MoonIcon, SeedlingIcon, SunIcon } from "./icons";
import { Segmented } from "./ui";

const REPO_URL = "https://github.com/diomnne/codeforest";

const TIME_OPTIONS = [
  { value: "day" as const, label: "Day", icon: <SunIcon /> },
  { value: "night" as const, label: "Night", icon: <MoonIcon /> },
];

type Props = {
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (value: TimeOfDay) => void;
};

export default function Header({ timeOfDay, onTimeOfDayChange }: Props) {
  return (
    <header className="brut-theme absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-2 sm:gap-4 border-b-2 border-(--ui-border) bg-(--ui-surface) px-4 py-3 sm:px-8 sm:py-4">
      <Link
        href="/"
        className="flex cursor-pointer items-center gap-2 sm:gap-3 text-(--ui-fg)"
      >
        <SeedlingIcon className="h-6 w-6 sm:h-8 sm:w-8 -mt-1" />
        <div className="flex flex-col items-left">
          <span className="text-base sm:text-xl font-bold uppercase">Code Forest</span>
          <span className="text-[10px] sm:text-xs text-(--ui-fg-muted) -mt-0.5">
            by diomnne
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-2 sm:gap-4">
        <Segmented
          label="Time of day"
          value={timeOfDay}
          options={TIME_OPTIONS}
          onChange={onTimeOfDayChange}
        />

        <div className="brut brut-press overflow-hidden flex items-center">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View this project on GitHub"
            className="brut-theme flex h-8 w-8 sm:h-10 sm:w-10 cursor-pointer items-center justify-center text-(--ui-fg-muted) hover:bg-(--ui-hover) hover:text-(--ui-fg)"
          >
            <GitHubIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
