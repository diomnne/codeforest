import { fetchContributions, mockContributions } from "@/lib/contributions";
import { fetchProfile } from "@/lib/profile";
import AppShell from "@/app/components/AppShell";
import LandingExperience from "@/app/components/LandingExperience";

export const DEFAULT_USER = "torvalds";

export default async function Home() {
  const [result, profile] = await Promise.all([
    fetchContributions(DEFAULT_USER),
    fetchProfile(DEFAULT_USER),
  ]);
  const data = result.ok ? result : mockContributions(DEFAULT_USER);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-(--ui-surface-solid)">
      <AppShell>
        <LandingExperience
          username={DEFAULT_USER}
          contributions={data.ok ? data.contributions : []}
          profile={profile}
        />
      </AppShell>
    </main>
  );
}
