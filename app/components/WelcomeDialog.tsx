"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Label, Panel, Scrim } from "./ui";

/**
 * Landing overlay. The sample forest is already rendering behind it, so this
 * dismisses rather than navigates when the user just wants to look around.
 */
export default function WelcomeDialog({
  exampleUser,
}: {
  exampleUser: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (dismissed) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = value.trim().replace(/^@/, "");
    if (!next) return;
    startTransition(() => router.push(`/${encodeURIComponent(next)}`));
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
      <Scrim />

      <Panel
        large
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="relative w-full max-w-md p-8"
      >
        <h1
          id="welcome-title"
          className="text-xl font-bold tracking-tight text-(--ui-fg) uppercase"
        >
          GitHub Forest
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-(--ui-fg-muted)">
          Your GitHub contribution graph, grown into a forest you can walk
          around. Every day becomes a plant — a quiet day is a seedling, your
          busiest is a tree.
        </p>

        <Button
          type="button"
          variant="accent"
          onClick={() => setDismissed(true)}
          className="mt-8 w-full py-3 text-sm"
        >
          View an example
        </Button>

        <div className="mt-8">
          <Label as="label" htmlFor="welcome-username">
            Or grow your forest
          </Label>
          <form onSubmit={submit} className="mt-2 flex gap-2">
            <input
              id="welcome-username"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter GitHub username"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="brut-theme min-w-0 flex-1 border-2 border-(--ui-border) bg-(--ui-surface-solid) px-4 py-2 text-sm text-(--ui-fg) placeholder:text-(--ui-fg-muted) focus:outline-none"
            />
            <Button
              type="submit"
              disabled={pending || !value.trim()}
              className="shrink-0"
            >
              {pending ? "…" : "Grow"}
            </Button>
          </form>
        </div>

        <Label className="mt-8 font-normal">
          Showing {exampleUser}&rsquo;s forest behind this card
        </Label>
      </Panel>
    </div>
  );
}
