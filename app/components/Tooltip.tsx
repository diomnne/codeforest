import type { GardenDay } from "@/lib/layout";

export default function Tooltip({
  day,
  x,
  y,
}: {
  day: GardenDay;
  x: number;
  y: number;
}) {
  return (
    <div
      className="brut pointer-events-none fixed z-20 -translate-x-1/2 -translate-y-[calc(100%+16px)] px-4 py-2 text-xs text-(--ui-fg) shadow-none"
      style={{ left: x, top: y }}
      role="status"
    >
      <div className="font-medium tabular-nums">{formatDate(day.date)}</div>
      <div className="text-(--ui-fg-muted)">
        {day.count === 1 ? "1 contribution" : `${day.count} contributions`}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
