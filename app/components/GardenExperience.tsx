"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { bestDay, sliceRange, sumCounts } from "@/lib/contributions";
import {
  getReducedMotionServerSnapshot,
  getReducedMotionSnapshot,
  subscribeReducedMotion,
} from "@/lib/reducedMotion";
import type { Contribution, Profile, RangeKey, TimeOfDay } from "@/lib/types";
import { useTimeOfDay } from "./AppShell";
import Controls from "./Controls";
import LoadingScreen from "./LoadingScreen";
import MockNotice from "./MockNotice";
import StatsPanel from "./StatsPanel";
import StoryModal from "./StoryModal";
import WelcomeDialog from "./WelcomeDialog";

const Garden = dynamic(() => import("./Garden"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

type Props = {
  username: string;
  contributions: Contribution[];
  profile: Profile | null;
    mock: boolean;
    chromeless?: boolean;
    onGrowAnother?: () => void;
};

export default function GardenExperience({
  username,
  contributions,
  profile,
  mock,
  chromeless = false,
  onGrowAnother,
}: Props) {
  const [range, setRange] = useState<RangeKey>("1y");
  const [metricsHidden, setMetricsHidden] = useState(false);
  const [storyCaptures, setStoryCaptures] = useState<{ day: string; night: string } | null>(null);
  const [internalGrow, setInternalGrow] = useState(false);
  const timeOfDay = useTimeOfDay();

  const handleGrowAnother = onGrowAnother ?? (() => setInternalGrow(true));
  const visible = useMemo(
    () => sliceRange(contributions, range),
    [contributions, range],
  );
  const total = useMemo(() => sumCounts(visible), [visible]);
  const best = useMemo(() => bestDay(visible), [visible]);
  const visibleFrom = visible.length > 0 ? visible[0].date : "";
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const captureRef = useRef<((override?: TimeOfDay) => string) | null>(null);
  const onRegisterCapture = useCallback(
    (fn: (override?: TimeOfDay) => string) => {
      captureRef.current = fn;
    },
    [],
  );

  function openStory() {
    const capture = captureRef.current;
    if (!capture) return;
    const currentUrl = capture();                                           // current palette, as-is
    const other: TimeOfDay = timeOfDay === "day" ? "night" : "day";
    const otherUrl = capture(other);                                        // sync scene patch + render
    setStoryCaptures(
      timeOfDay === "day"
        ? { day: currentUrl, night: otherUrl }
        : { day: otherUrl, night: currentUrl },
    );
  }

  return (
    <div className="relative h-full w-full">
      {!reducedMotion && (
        <Suspense fallback={<LoadingScreen />}>
          <Garden
            username={username}
            contributions={contributions}
            visibleFrom={visibleFrom}
            timeOfDay={timeOfDay}
            onRegisterCapture={onRegisterCapture}
          />
        </Suspense>
      )}

      {!chromeless && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-8">
            <Controls
              username={username}
              range={range}
              onRangeChange={setRange}
              onDownloadStory={!mock ? openStory : undefined}
              onGrowAnother={handleGrowAnother}
            />
          </div>
          {!mock && (
            <div className="pointer-events-none absolute inset-y-0 inset-x-0 z-10 flex items-start justify-center overflow-y-auto p-8 pt-24 sm:inset-x-auto sm:right-0 sm:justify-end">
              <StatsPanel
                username={username}
                profile={profile}
                total={total}
                best={best}
                range={range}
                metricsHidden={metricsHidden}
                onToggleMetrics={() => setMetricsHidden((v) => !v)}
              />
            </div>
          )}

          {mock && <MockNotice username={username} />}
        </>
      )}
      {storyCaptures !== null && (
        <StoryModal
          username={username}
          profile={profile}
          total={total}
          best={best}
          range={range}
          dayForestUrl={storyCaptures.day}
          nightForestUrl={storyCaptures.night}
          timeOfDay={timeOfDay}
          onClose={() => setStoryCaptures(null)}
        />
      )}
      {internalGrow && (
        <WelcomeDialog
          exampleUser={username}
          onDismiss={() => setInternalGrow(false)}
          isCancel={true}
        />
      )}
    </div>
  );
}
