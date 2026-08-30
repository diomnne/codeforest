import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchContributions, mockContributions } from "@/lib/contributions";
import { fetchProfile } from "@/lib/profile";
import AppShell from "@/app/components/AppShell";
import GardenExperience from "@/app/components/GardenExperience";
import StaticGarden from "@/app/components/StaticGarden";
import { ButtonLink } from "@/app/components/ui";

export async function generateMetadata(
  props: PageProps<"/[username]">,
): Promise<Metadata> {
  const { username } = await props.params;
  return {
    title: `${username}'s forest — GitHub Forest`,
    description: `A 3D forest grown from ${username}'s past year of GitHub contributions.`,
  };
}

export default async function UserGardenPage(props: PageProps<"/[username]">) {
  const { username } = await props.params;

  // Profile is a garnish and is allowed to be null; contributions decide
  // whether there is a page at all.
  const [result, profile] = await Promise.all([
    fetchContributions(username),
    fetchProfile(username),
  ]);

  // A genuinely unknown user is a 404. A transport failure is not — we fall back
  // to sample data and say so, rather than showing an error page.
  if (!result.ok && result.reason === "not-found") notFound();

  const data = result.ok ? result : mockContributions(username);
  const isMock = !result.ok;
  // Don't attribute a real profile to a fabricated forest.
  const shownProfile = isMock ? null : profile;
  const contributions = data.ok ? data.contributions : [];
  const hasPlants = contributions.some((c) => c.level > 0);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-(--ui-surface-solid)">
      <AppShell>
        {/* Reduced-motion users get the server-rendered static view; everyone
            else gets the canvas. The choice is made in CSS, not in JS. */}
        <div className="motion-reduce-hidden h-full w-full">
          {hasPlants ? (
            <GardenExperience
              username={username}
              contributions={contributions}
              profile={shownProfile}
              mock={isMock}
            />
          ) : (
            <EmptyYear username={username} />
          )}
        </div>

        <div className="motion-reduce-only h-full w-full">
          <StaticGarden
            username={username}
            contributions={contributions}
            total={contributions.reduce((a, c) => a + c.count, 0)}
          />
        </div>
      </AppShell>
    </main>
  );
}

function EmptyYear({ username }: { username: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm text-(--ui-fg)">Bare soil.</p>
      <p className="max-w-sm text-xs text-(--ui-fg-muted)">
        <span className="text-(--ui-fg)">{username}</span> has no public
        contributions in the past year, so there is nothing to grow.
      </p>
      <ButtonLink href="/" variant="accent" className="mt-4">
        Grow another forest
      </ButtonLink>
    </div>
  );
}
