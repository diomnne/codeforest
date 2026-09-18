"use client";

import { useEffect, useRef, useState } from "react";
import { RANGE_OPTIONS, type RangeKey } from "@/lib/types";
import { CopyIcon, PlusIcon, SeedlingIcon, ShareIcon } from "./icons";
import { Button, ButtonLink, Segmented } from "./ui";

type Props = {
  username: string;
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
  onDownloadStory?: () => void;
    onGrowAnother?: () => void;
};

export default function Controls({
  username,
  range,
  onRangeChange,
  onDownloadStory,
  onGrowAnother,
}: Props) {
  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-4">
      <Segmented
        label="Date range"
        value={range}
        options={RANGE_OPTIONS}
        onChange={onRangeChange}
      />

      <div className="flex flex-wrap items-center gap-2">
        <ShareButton username={username} onDownloadStory={onDownloadStory} />

        {onGrowAnother ? (
          <Button
            type="button"
            onClick={onGrowAnother}
            className="inline-flex items-center gap-2"
          >
            <SeedlingIcon className="h-4 w-4" />
            Grow another
          </Button>
        ) : (
          <ButtonLink href="/" className="inline-flex items-center gap-2">
            <SeedlingIcon className="h-4 w-4" />
            Grow another
          </ButtonLink>
        )}
      </div>
    </div>
  );
}

function ShareButton({
  username,
  onDownloadStory,
}: {
  username: string;
  onDownloadStory?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function copyLink() {
    const url = `https://code-forest.vercel.app/${encodeURIComponent(username)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1800);
    } catch {
    }
  }

  function downloadStory() {
    setOpen(false);
    onDownloadStory?.();
  }

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2"
      >
        <ShareIcon className="h-4 w-4" />
        Share
      </Button>

      {open && (
        <div
          role="menu"
          className="brut absolute bottom-full left-0 mb-2 flex min-w-max flex-col"
        >
          <button
            role="menuitem"
            type="button"
            onClick={copyLink}
            className="brut-theme flex cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-xs font-bold uppercase text-(--ui-fg) hover:bg-(--ui-hover)"
          >
            <CopyIcon className="h-4 w-4 shrink-0" />
            {copied ? "Copied!" : "Copy link"}
          </button>
          {onDownloadStory && (
            <button
              role="menuitem"
              type="button"
              onClick={downloadStory}
              className="brut-theme flex cursor-pointer items-center gap-3 border-t-2 border-(--ui-border) px-4 py-2.5 text-left text-xs font-bold uppercase text-(--ui-fg) hover:bg-(--ui-hover)"
            >
              <PlusIcon className="h-4 w-4 shrink-0" />
              Add to story
            </button>
          )}
        </div>
      )}
    </div>
  );
}
