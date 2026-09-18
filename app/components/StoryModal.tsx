"use client";

import { useEffect, useRef, useState } from "react";
import type { Contribution, Profile, RangeKey, TimeOfDay } from "@/lib/types";
import { RANGE_OPTIONS } from "@/lib/types";
import { DownloadIcon } from "./icons";
import { Button, Panel, Scrim } from "./ui";
const W = 1080;
const H = 1920;
const CX = W / 2; 
const COL_L = 330;
const COL_R = 1080 - 330; // 750
const INK = "#f4f7f0";

type Status = "composing" | "ready" | "error";

type Props = {
  username: string;
  profile: Profile | null;
  total: number;
  best: Contribution | null;
  range: RangeKey;
    dayForestUrl: string;
    nightForestUrl: string;
    timeOfDay: TimeOfDay;
  onClose: () => void;
};

export default function StoryModal({
  username,
  profile,
  total,
  best,
  range,
  dayForestUrl,
  nightForestUrl,
  timeOfDay,
  onClose,
}: Props) {
  const [status, setStatus] = useState<Status>("composing");
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<TimeOfDay>(timeOfDay);
  const composedOnce = useRef(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    if (!composedOnce.current) setStatus("composing");

    const forestUrl = selectedTheme === "day" ? dayForestUrl : nightForestUrl;

    async function compose(): Promise<string> {
      if (!forestUrl) throw new Error("No forest data");

      await Promise.allSettled([
        document.fonts.load(`bold 84px 'Chivo Mono'`),
        document.fonts.load(`bold 68px 'Chivo Mono'`),
        document.fonts.load(`bold 20px 'Chivo Mono'`),
        document.fonts.load(`26px 'Chivo Mono'`),
        document.fonts.load(`52px 'Chivo Mono'`),
      ]);

      const SEEDLING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${encodeURIComponent(INK)}"><path d="m18,2v1h-2v1h-2v1h-1v1h-1v2h1v2h1v2h2v-1h2v-1h2v-1h1v-1h1v-2h1V2h-5Zm2,4v2h-2v1h-2v1h-1v-2h-1v-2h2v-1h2v-1h3v2h-1Z"/><path d="m12,9h-1v-1h-1v-1h-2v-1h-2v-1H1v3h1v2h1v2h1v1h1v1h2v1h4v7h2v-11h-1v-2Zm-7,3v-2h-1v-2h-1v-1h3v1h2v1h2v2h1v2h-4v-1h-2Z"/></svg>`;
      const seedlingUrl = "data:image/svg+xml;charset=utf-8," + SEEDLING_SVG;
      
      const [img, seedlingImg] = await Promise.all([
        loadImage(forestUrl),
        loadImage(seedlingUrl),
      ]);

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      const scale = Math.max(W / img.width, H / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      const FONT = `'Chivo Mono', monospace`;
      ctx.fillStyle = INK;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 4;

      const alpha = (a: number) => { ctx.globalAlpha = a; };
      const reset = () => { ctx.globalAlpha = 1; };
      ctx.font = `bold 52px ${FONT}`;
      
      const textStr = "CODE FOREST";
      const textW = ctx.measureText(textStr).width;
      
      const iconSize = 48;
      const gap = 16;
      const totalW = iconSize + gap + textW;
      
      const startX = CX - totalW / 2;

      const padX = 40;
      const padY = 28;
      ctx.lineWidth = 4;
      ctx.strokeStyle = INK;
      ctx.strokeRect(startX - padX, 330 - 42 - padY, totalW + padX * 2, iconSize + padY * 2);
      
      ctx.drawImage(seedlingImg, startX, 330 - 42, iconSize, iconSize);
      
      ctx.textAlign = "left";
      ctx.fillText(textStr, startX + iconSize + gap, 330);
      
      ctx.textAlign = "center";
      {
        const title = `${username}'s Forest`;
        const maxW = W - 120;
        let size = 84;
        ctx.font = `bold ${size}px ${FONT}`;
        while (ctx.measureText(title).width > maxW && size > 28) {
          size -= 2;
          ctx.font = `bold ${size}px ${FONT}`;
        }
        ctx.fillText(title, CX, 650);
      }
      {
        const urlStr = `code-forest.vercel.app/${username}`;
        const maxW = W - 120;
        let size = 40;
        ctx.font = `${size}px ${FONT}`;
        while (ctx.measureText(urlStr).width > maxW && size > 16) {
          size -= 2;
          ctx.font = `${size}px ${FONT}`;
        }
        ctx.fillText(urlStr, CX, 730);
      }
      reset();
      const rangeLabel = RANGE_OPTIONS.find((r) => r.value === range)?.label ?? "Past year";
      
      function stat(label: string, value: string, x: number, y: number, note?: string) {
        ctx.letterSpacing = "3px";
        ctx.font = `36px ${FONT}`;
        ctx.fillText(label.toUpperCase(), x, y);
        ctx.letterSpacing = "0px";
        reset();
        ctx.font = `bold 68px ${FONT}`;
        ctx.fillText(value, x, y + 72);
        if (note) {
          ctx.font = `26px ${FONT}`;
          ctx.fillText(note, x, y + 116);
        }
      }

      stat("Contributions", total.toLocaleString(), COL_L, 930, rangeLabel);
      stat("Best day", best ? best.count.toLocaleString() : "—", COL_R, 930, best ? formatShort(best.date) : undefined);
      stat("Repositories", profile ? profile.publicRepos.toLocaleString() : "—", COL_L, 1160);
      stat("Followers", profile ? compact(profile.followers) : "—", COL_R, 1160);
      const langs = profile?.topLanguages ?? [];
      if (langs.length > 0) {
        const SEP = " | ";
        const langText = langs.join(SEP);
        const maxW = W - 160;
        ctx.letterSpacing = "3px";
        ctx.font = `36px ${FONT}`;
        ctx.fillText("TOP LANGUAGES", CX, 1390);
        ctx.letterSpacing = "0px";
        reset();

        ctx.font = `bold 42px ${FONT}`;
        if (ctx.measureText(langText).width <= maxW) {
          ctx.fillText(langText, CX, 1470);
        } else {
          const mid = Math.ceil(langs.length / 2);
          ctx.fillText(langs.slice(0, mid).join(SEP), CX, 1460);
          ctx.fillText(langs.slice(mid).join(SEP), CX, 1520);
        }
      }

      return canvas.toDataURL("image/png");
    }

    compose()
      .then((url) => {
        if (cancelled) return;
        setPreviewUrl(url);
        setStatus("ready");
        composedOnce.current = true;
      })
      .catch(() => {
        if (cancelled) return;
        if (!composedOnce.current) setStatus("error");
      });

    return () => { cancelled = true; };
  }, [selectedTheme]);

  function download() {
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `${username}-forest-story.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Scrim />

      <Panel
        large
        role="dialog"
        aria-modal="true"
        aria-label="Story preview"
        className="relative z-10 flex w-full max-w-sm flex-col gap-5 p-6"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-(--ui-fg-muted)">
            Story preview
          </p>
          <button
            type="button"
            onClick={onClose}
            className="brut-theme cursor-pointer text-[10px] font-bold uppercase tracking-wider text-(--ui-fg-muted) hover:text-(--ui-fg)"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {status === "composing" && (
          <div className="flex items-center justify-center py-16">
            <p className="animate-pulse text-[10px] font-bold uppercase tracking-widest text-(--ui-fg-muted)">
              Composing story…
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-10">
            <p className="text-xs text-(--ui-fg)">
              Could not capture the forest. Try again after the scene finishes
              loading.
            </p>
            <Button type="button" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
        {status === "ready" && (
          <>
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt="Story preview — your forest with metrics overlay"
                style={{ maxHeight: "52vh", width: "auto" }}
                className="border-2 border-(--ui-border)"
              />
            </div>
            <div className="flex justify-center gap-6">
              {(["day", "night"] as TimeOfDay[]).map((t) => {
                const active = selectedTheme === t;
                const thumbUrl = t === "day" ? dayForestUrl : nightForestUrl;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTheme(t)}
                    className="brut-theme flex cursor-pointer flex-col items-center gap-2"
                  >
                    <div
                      className={`h-16 w-16 overflow-hidden border-2 transition-opacity ${
                        active
                          ? "border-(--ui-fg) opacity-100"
                          : "border-(--ui-border) opacity-45"
                      }`}
                    >
                      <img
                        src={thumbUrl}
                        alt={t}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        active ? "text-(--ui-fg)" : "text-(--ui-fg-muted)"
                      }`}
                    >
                      {t}
                    </p>
                  </button>
                );
              })}
            </div>
            <Button
              type="button"
              variant="accent"
              onClick={download}
              className="inline-flex w-full items-center justify-center gap-2 py-3"
            >
              <DownloadIcon className="h-4 w-4" />
              Save image
            </Button>
          </>
        )}
      </Panel>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
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
