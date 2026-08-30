"use client";

import { useState } from "react";
import { Button, ButtonLink, Panel, Scrim } from "./ui";

/**
 * Shown when the contributions API could not be reached and the forest below is
 * generated sample data. Dismissible, because the point is to let people keep
 * looking at the scene — but stated plainly, since an unlabelled fake forest
 * attributed to a real username would be misleading.
 */
export default function MockNotice({ username }: { username: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
      <Scrim />

      <Panel
        large
        role="dialog"
        aria-modal="true"
        aria-labelledby="mock-title"
        className="relative w-full max-w-md p-8"
      >
        <h2
          id="mock-title"
          className="text-lg font-bold tracking-tight text-(--ui-fg) uppercase"
        >
          Showing a sample forest
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-(--ui-fg-muted)">
          We couldn&rsquo;t load contribution data for{" "}
          <span className="text-(--ui-fg)">{username}</span> just now, so the
          forest below is generated sample data.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-(--ui-fg-muted)">
          The contributions API is occasionally slow or rate limited. Reloading
          in a moment usually works.
        </p>

        <div className="mt-8 flex gap-4">
          <Button
            type="button"
            variant="accent"
            onClick={() => setDismissed(true)}
            className="flex-1 py-3"
          >
            Explore the sample
          </Button>
          <ButtonLink href="/" className="py-3">
            Start over
          </ButtonLink>
        </div>
      </Panel>
    </div>
  );
}
