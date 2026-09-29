import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoBack } from "@/components/GoBack";
import "./(professional)/professional.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Page not found · Srinivaas Vaibhav",
};

/*
 * Neutral 404 shared by both modes. It only offers "Go back", so it can never
 * become a route from professional mode into the cinematic site.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <main className="flex min-h-screen items-center justify-center px-6">
          <div className="max-w-md text-center">
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-accent">404</p>
            <h1 className="mt-3 text-3xl font-semibold text-ink">This page doesn&apos;t exist.</h1>
            <p className="mt-3 text-[15px] text-muted">The link may be old, or the address mistyped.</p>
            <GoBack className="mt-8 inline-flex rounded-md bg-ink px-4 py-2.5 text-[14px] font-medium text-white hover:bg-accent" />
          </div>
        </main>
      </body>
    </html>
  );
}
