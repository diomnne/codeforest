import type { Metadata } from "next";
import { Chivo_Mono } from "next/font/google";
import "./globals.css";

const chivoMono = Chivo_Mono({
  variable: "--font-chivo-mono",
  subsets: ["latin"],
  // 400 for body, 500/700 for the heavier neobrutalist labels and headings.
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "GitHub Forest",
  description:
    "A GitHub user's past-year contribution graph, grown into a navigable 3D forest.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

/**
 * Applies the stored theme before first paint. Without this a night-mode
 * visitor would see a frame of the light UI on every full page load, because
 * React can only set `data-theme` after hydration.
 */
const THEME_SCRIPT = `try{var t=localStorage.getItem("gh-forest-theme");document.documentElement.dataset.theme=t==="night"?"night":"day"}catch(e){document.documentElement.dataset.theme="day"}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `data-theme` is deliberately absent here and set by THEME_SCRIPT before
    // paint. Rendering it server-side would guess "day" and mismatch during
    // hydration for anyone who chose night.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${chivoMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
