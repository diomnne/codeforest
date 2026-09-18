"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SeedlingIcon } from "./icons";
import { Button, Label, Panel, Scrim } from "./ui";

export default function WelcomeDialog({
  exampleUser,
  onDismiss,
  isCancel = false,
}: {
  exampleUser: string;
  onDismiss: () => void;
  isCancel?: boolean;
}) {
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

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
          {isCancel ? "Grow Another Forest" : "Welcome to Code Forest!"}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-(--ui-fg-muted)">
          Your GitHub contribution graph, planted as a forest.
          Quiet days grow seedlings, busy ones grow trees.
        </p>

        {!isCancel && (
          <Button
            type="button"
            variant="accent"
            onClick={onDismiss}
            className="mt-8 w-full py-3 text-sm"
          >
            <SeedlingIcon className="mr-2 inline-block h-4 w-4" />
            View an example
          </Button>
        )}

        <div className="mt-8">
          <Label as="label" htmlFor="welcome-username">
            {isCancel ? "GitHub username" : "Or grow your forest"}
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
              className="brut-theme min-w-0 flex-1 rounded-sm border-2 border-(--ui-border) bg-(--ui-surface-solid) px-4 py-2 text-sm text-(--ui-fg) placeholder:text-(--ui-fg-muted) focus:outline-none"
            />
            <Button
              type="submit"
              variant="accent"
              disabled={pending || !value.trim()}
              className="shrink-0"
            >
              {pending ? (
                "…"
              ) : (
                <>
                  <SeedlingIcon className="mr-1.5 inline-block h-4 w-4" />
                  Grow
                </>
              )}
            </Button>
          </form>
          <p className="mt-2 text-[10px] uppercase tracking-wider text-(--ui-fg-muted)">
            * Only works on public contributions for now
          </p>
          {isCancel && (
            <Button
              type="button"
              onClick={onDismiss}
              className="mt-4 w-full py-3 text-sm text-center justify-center"
            >
              Cancel
            </Button>
          )}
        </div>

        <Label className="mt-8 font-normal">
          Showing {exampleUser}&rsquo;s forest behind this card
        </Label>
      </Panel>
    </div>
  );
}
