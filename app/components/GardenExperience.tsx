"use client";

import dynamic from "next/dynamic";
import { Suspense, useMemo, useState, useSyncExternalStore } from "react";
import { bestDay, sliceRange, sumCounts } from "@/lib/contributions";
import {
  getReducedMotionServerSnapshot,
  getReducedMotionSnapshot,
  subscribeReducedMotion,
} from "@/lib/reducedMotion";
import type { Contribution, Profile, RangeKey } from "@/lib/types";
import { useTimeOfDay } from "./AppShell";
import Controls from "./Controls";
import LoadingScreen from "./LoadingScreen";
import MockNotice from "./MockNotice";
import StatsPanel from "./StatsPanel";

/**
 * `ssr: false` is only legal inside a Client Component, so the dynamic import
 * lives here rather than in the server page. R3F has no WebGL context on the
 * server, so the canvas must never be prerendered.
 */
const Garden = dynamic(() => import("./Garden"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

type Props = {
  username: string;
  contributions: Contribution[];
  profile: Profile | null;
  /** True when `contributions` is generated sample data, not real activity. */
  mock: boolean;
  /** Hides the stats panel and controls for the landing page's sample forest. */
  chromeless?: boolean;
};

export default function GardenExperience({
  username,
  contributions,
  profile,
  mock,
  chromeless = false,
}: Props) {
  const [range, setRange] = useState<RangeKey>("1y");
  const [metricsHidden, setMetricsHidden] = useState(false);
  const timeOfDay = useTimeOfDay();

  // The range selector is a view over one dataset — no refetch, no navigation.
  const visible = useMemo(
    () => sliceRange(contributions, range),
    [contributions, range],
  );
  const total = useMemo(() => sumCounts(visible), [visible]);
  const best = useMemo(() => bestDay(visible), [visible]);

  // The scene always gets the full window and hides days before this date, so
  // the instance count stays fixed and range changes can animate.
  const visibleFrom = visible.length > 0 ? visible[0].date : "";

  // CSS already hides this subtree under reduced motion, but that only stops it
  // being *painted* — the canvas would still boot a WebGL context and hold it
  // for a view nobody sees. Skip mounting it entirely for those users.
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  return (
    <div className="relative h-full w-full">
      {!reducedMotion && (
        <Suspense fallback={<LoadingScreen />}>
          <Garden
            username={username}
            contributions={contributions}
            visibleFrom={visibleFrom}
            timeOfDay={timeOfDay}
          />
        </Suspense>
      )}

      {!chromeless && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-8">
            <Controls
              range={range}
              metricsHidden={metricsHidden}
              onRangeChange={setRange}
              onToggleMetrics={() => setMetricsHidden((v) => !v)}
            />
          </div>

          {/* With sample data there are no real metrics to show. Rendering the
              user's actual name, avatar and follower count beside fabricated
              contribution totals reads as though the numbers were theirs. */}
          {!mock && !metricsHidden && (
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-start justify-end overflow-y-auto p-8 pt-24">
              <StatsPanel
                username={username}
                profile={profile}
                total={total}
                best={best}
                range={range}
              />
            </div>
          )}

          {mock && <MockNotice username={username} />}
        </>
      )}
    </div>
  );
}
