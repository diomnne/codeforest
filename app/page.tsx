import { fetchContributions, mockContributions } from "@/lib/contributions";
import AppShell from "@/app/components/AppShell";
import GardenExperience from "@/app/components/GardenExperience";
import WelcomeDialog from "@/app/components/WelcomeDialog";

export const DEFAULT_USER = "torvalds";

/**
 * The landing page renders a real forest behind the welcome card, so dismissing
 * the card leaves you somewhere rather than on an empty page. It falls back to
 * sample data silently — the card is the point here, not the data's provenance.
 */
export default async function Home() {
  const result = await fetchContributions(DEFAULT_USER);
  const data = result.ok ? result : mockContributions(DEFAULT_USER);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-(--ui-surface-solid)">
      <AppShell>
        <div className="motion-reduce-hidden h-full w-full">
          <GardenExperience
            username={DEFAULT_USER}
            contributions={data.ok ? data.contributions : []}
            profile={null}
            mock={false}
            chromeless
          />
        </div>

        <WelcomeDialog exampleUser={DEFAULT_USER} />
      </AppShell>
    </main>
  );
}
