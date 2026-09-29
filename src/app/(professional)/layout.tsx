import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { profile } from "@/data/content";
import "./professional.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const serif = Source_Serif_4({ variable: "--font-serif-pro", subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: `${profile.name} · ${profile.role}`,
  description: profile.shortBio,
  openGraph: {
    title: `${profile.name} · ${profile.role}`,
    description: profile.tagline,
    type: "profile",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbfaf7",
  colorScheme: "light",
};

/*
 * A separate root layout: professional mode shares no shell, script or
 * navigation with the cinematic site, so there is nothing here that can lead
 * back to it (see src/lib/mode.ts for the full one-way door).
 */
export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
