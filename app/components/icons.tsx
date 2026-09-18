
type IconProps = { className?: string };

const BASE = {
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
} as const;

export function GitHubIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <polygon points="23 9 23 15 22 15 22 17 21 17 21 19 20 19 20 20 19 20 19 21 18 21 18 22 16 22 16 23 15 23 15 18 14 18 14 17 15 17 15 16 17 16 17 15 18 15 18 14 19 14 19 9 18 9 18 6 16 6 16 7 15 7 15 8 14 8 14 7 10 7 10 8 9 8 9 7 8 7 8 6 6 6 6 9 5 9 5 14 6 14 6 15 7 15 7 16 9 16 9 18 7 18 7 17 6 17 6 16 4 16 4 17 5 17 5 19 6 19 6 20 9 20 9 23 8 23 8 22 6 22 6 21 5 21 5 20 4 20 4 19 3 19 3 17 2 17 2 15 1 15 1 9 2 9 2 7 3 7 3 5 4 5 4 4 5 4 5 3 7 3 7 2 9 2 9 1 15 1 15 2 17 2 17 3 19 3 19 4 20 4 20 5 21 5 21 7 22 7 22 9 23 9" />
    </svg>
  );
}

export function SunIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="m21,11v-1h1v-1h1v-2h-3v-1h-2v-2h-1V1h-2v1h-1v1h-1v1h-2v-1h-1v-1h-1v-1h-2v3h-1v2h-2v1H1v2h1v1h1v1h1v2h-1v1h-1v1h-1v2h3v1h2v2h1v3h2v-1h1v-1h1v-1h2v1h1v1h1v1h2v-3h1v-2h2v-1h3v-2h-1v-1h-1v-1h-1v-2h1Zm-2,2v1h1v1h1v1h-3v1h-1v1h-1v3h-1v-1h-1v-1h-1v-1h-2v1h-1v1h-1v1h-1v-3h-1v-1h-1v-1h-3v-1h1v-1h1v-1h1v-2h-1v-1h-1v-1h-1v-1h3v-1h1v-1h1v-3h1v1h1v1h1v1h2v-1h1v-1h1v-1h1v2h1v2h1v1h3v1h-1v1h-1v1h-1v2h1Z" />
      <path d="m16,10v-1h-1v-1h-1v-1h-4v1h-1v1h-1v1h-1v4h1v1h1v1h1v1h4v-1h1v-1h1v-1h1v-4h-1Zm-1,4h-1v1h-4v-1h-1v-4h1v-1h4v1h1v4Z" />
    </svg>
  );
}

export function MoonIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="m21,17v1h-2v1h-4v-1h-2v-1h-2v-1h-1v-2h-1v-2h-1v-4h1v-2h1v-2h1v-1h2v-1h2v-1h-5v1h-2v1h-2v1h-1v1h-1v2h-1v2h-1v6h1v2h1v2h1v1h1v1h2v1h2v1h6v-1h2v-1h2v-1h1v-1h1v-2h-1Zm-13,3v-1h-2v-2h-1v-2h-1v-6h1v-2h1v-2h2v1h-1v2h-1v4h1v2h1v2h1v1h1v1h1v1h2v1h2v1h-5v-1h-2Z" />
    </svg>
  );
}

export function SeedlingIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="m18,2v1h-2v1h-2v1h-1v1h-1v2h1v2h1v2h2v-1h2v-1h2v-1h1v-1h1v-2h1V2h-5Zm2,4v2h-2v1h-2v1h-1v-2h-1v-2h2v-1h2v-1h3v2h-1Z" />
      <path d="m12,9h-1v-1h-1v-1h-2v-1h-2v-1H1v3h1v2h1v2h1v1h1v1h2v1h4v7h2v-11h-1v-2Zm-7,3v-2h-1v-2h-1v-1h3v1h2v1h2v2h1v2h-4v-1h-2Z" />
    </svg>
  );
}

export function ShareIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <path d="m20,9v-1h1v-2h1v-2h-1v-2h-1v-1h-5v1h-1v2h-1v2h-1v1h-1v1h-1v1h-1v-1h-5v1h-1v2h-1v2h1v2h1v1h5v-1h1v1h1v1h1v1h1v2h1v2h1v1h5v-1h1v-2h1v-2h-1v-2h-1v-1h-5v1h-2v-1h-1v-1h-1v-4h1v-1h1v-1h2v1h5Zm-11,4h-1v1h-3v-1h-1v-2h1v-1h3v1h1v2Zm6,5h1v-1h3v1h1v2h-1v1h-3v-1h-1v-2Zm0-14h1v-1h3v1h1v2h-1v1h-3v-1h-1v-2Z" />
    </svg>
  );
}

export function CopyIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <polygon points="16 20 16 22 15 22 15 23 3 23 3 22 2 22 2 6 3 6 3 5 6 5 6 20 16 20" />
      <path d="m16,7V1h-8v1h-1v16h1v1h13v-1h1V7h-6Zm4,10h-11V3h5v6h6v8Z" />
      <polygon points="22 5 22 6 17 6 17 1 18 1 18 2 19 2 19 3 20 3 20 4 21 4 21 5 22 5" />
    </svg>
  );
}

export function DownloadIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <polygon points="5 10 4 10 4 8 6 8 6 9 7 9 7 10 8 10 8 11 9 11 9 12 10 12 10 13 11 13 11 1 13 1 13 13 14 13 14 12 15 12 15 11 16 11 16 10 17 10 17 9 18 9 18 8 20 8 20 10 19 10 19 11 18 11 18 12 17 12 17 13 16 13 16 14 15 14 15 15 14 15 14 16 13 16 13 17 11 17 11 16 10 16 10 15 9 15 9 14 8 14 8 13 7 13 7 12 6 12 6 11 5 11 5 10" />
      <rect x="2" y="21" width="20" height="2" />
    </svg>
  );
}

export function PlusIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg {...BASE} className={className}>
      <polygon points="23 11 23 13 13 13 13 23 11 23 11 13 1 13 1 11 11 11 11 1 13 1 13 11 23 11" />
    </svg>
  );
}
