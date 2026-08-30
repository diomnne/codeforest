import type { Contribution } from "@/lib/types";

const LEVEL_COLORS = ["#1d2b1c", "#2f6d2c", "#3f8a34", "#5fa93c", "#9ccf6a"];

/**
 * A flat 2D representation of the same data, rendered on the *server* so it is
 * present in the initial HTML before any JS runs. CSS decides which of this and
 * the canvas is visible, so there's no client-side flash and no dependency on
 * hydration for reduced-motion users.
 */
export default function StaticGarden({
  username,
  contributions,
  total,
}: {
  username: string;
  contributions: Contribution[];
  total: number;
}) {
  // Same 7 x ~53 arrangement as layout B, as plain squares.
  const first = new Date(`${contributions[0].date}T00:00:00Z`);
  const offset = first.getUTCDay();
  const columns: (Contribution | null)[][] = [];

  for (let i = 0; i < offset; i++) {
    if (!columns[0]) columns[0] = [];
    columns[0].push(null);
  }
  contributions.forEach((c, i) => {
    const col = Math.floor((i + offset) / 7);
    if (!columns[col]) columns[col] = [];
    columns[col].push(c);
  });

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 overflow-x-auto bg-neutral-950 p-6">
      <div>
        <h2 className="text-sm font-medium text-white">
          {username}&rsquo;s contribution forest
        </h2>
        <p className="mt-1 text-xs text-neutral-400">
          {total.toLocaleString()} contributions in the past year. Showing a
          static view because your system requests reduced motion.
        </p>
      </div>

      <div className="flex gap-[3px]" aria-hidden="true">
        {columns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) =>
              day ? (
                <span
                  key={day.date}
                  title={`${day.date}: ${day.count}`}
                  className="h-[10px] w-[10px] rounded-[2px]"
                  style={{ backgroundColor: LEVEL_COLORS[day.level] }}
                />
              ) : (
                <span key={`pad-${di}`} className="h-[10px] w-[10px]" />
              ),
            )}
          </div>
        ))}
      </div>

      <table className="sr-only">
        <caption>
          Daily GitHub contributions for {username} over the past year
        </caption>
        <tbody>
          {contributions.map((c) => (
            <tr key={c.date}>
              <th scope="row">{c.date}</th>
              <td>{c.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
