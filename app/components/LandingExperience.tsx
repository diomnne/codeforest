"use client";

import { useState } from "react";
import type { Contribution, Profile } from "@/lib/types";
import GardenExperience from "./GardenExperience";
import WelcomeDialog from "./WelcomeDialog";

export default function LandingExperience({
  username,
  contributions,
  profile,
}: {
  username: string;
  contributions: Contribution[];
  profile: Profile | null;
}) {
  const [showingCard, setShowingCard] = useState(true);
  const [hasDismissed, setHasDismissed] = useState(false);

  return (
    <>
      <div className="motion-reduce-hidden h-full w-full">
        <GardenExperience
          username={username}
          contributions={contributions}
          profile={profile}
          mock={false}
          chromeless={showingCard}
          onGrowAnother={() => setShowingCard(true)}
        />
      </div>

      {showingCard && (
        <WelcomeDialog
          exampleUser={username}
          onDismiss={() => {
            setShowingCard(false);
            setHasDismissed(true);
          }}
          isCancel={hasDismissed}
        />
      )}
    </>
  );
}
