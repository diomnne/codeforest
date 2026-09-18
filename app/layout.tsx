import type { Metadata } from "next";
import { Chivo_Mono } from "next/font/google";
import "./globals.css";

const chivoMono = Chivo_Mono({
  variable: "--font-chivo-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Code Forest",
  description:
    "A GitHub user's past-year contribution graph, grown into a navigable 3D forest.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const THEME_SCRIPT = `try{var t=localStorage.getItem("gh-forest-theme");document.documentElement.dataset.theme=t==="night"?"night":"day"}catch(e){document.documentElement.dataset.theme="day"}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
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
