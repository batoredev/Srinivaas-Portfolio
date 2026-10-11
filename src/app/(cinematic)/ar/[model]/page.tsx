import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AR_MODELS, isArId } from "@/components/cinematic/ar/arCatalog";
import { ArPage } from "@/components/cinematic/ar/ArPage";

// Rendered per request, not prerendered: the Cloudflare build runs without an
// incremental cache (cloudflare/open-next.config.ts), so prerendered pages of
// a dynamic route would 404 there. These pages are never cached anyway.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ model: string }> }): Promise<Metadata> {
  const { model } = await params;
  if (!isArId(model)) return {};
  return { title: `${AR_MODELS[model].title} in AR · Srinivaas Vaibhav`, description: AR_MODELS[model].caption };
}

export default async function Page({ params }: { params: Promise<{ model: string }> }) {
  const { model } = await params;
  if (!isArId(model)) notFound();
  return <ArPage id={model} />;
}
