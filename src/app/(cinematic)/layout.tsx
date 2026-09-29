import type { Metadata, Viewport } from "next";
import { Chakra_Petch, JetBrains_Mono, Sora } from "next/font/google";
import { cinematicGuardScript } from "@/lib/mode";
import { profile } from "@/data/content";
import "./cinematic.css";

const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const jet = JetBrains_Mono({
  variable: "--font-jet",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${profile.name} · Neural Interface`,
  description: profile.tagline,
  openGraph: {
    title: `${profile.name} · Founder & Full-Stack Developer`,
    description: profile.tagline,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#020409",
  colorScheme: "dark",
};

export default function CinematicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${chakra.variable} ${jet.variable} ${sora.variable}`}>
      <head>
        {/* One-way door, client half: leave before first paint if locked. */}
        <script dangerouslySetInnerHTML={{ __html: cinematicGuardScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
