import { ButtonLink } from "@/app/components/ui";

export default function NotFound() {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-4 bg-(--ui-surface-solid) p-8 text-center">
      <h1 className="text-lg font-bold tracking-tight text-(--ui-fg) uppercase">
        No forest here
      </h1>
      <p className="max-w-sm text-xs text-(--ui-fg-muted)">
        That GitHub user doesn&rsquo;t exist, or has no public contribution
        history we can read.
      </p>
      <ButtonLink href="/" variant="accent" className="mt-4">
        Grow a forest
      </ButtonLink>
    </main>
  );
}
