import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AR_IDS, AR_MODELS, isArId } from "@/components/cinematic/ar/arCatalog";
import { ArPage } from "@/components/cinematic/ar/ArPage";

export const dynamicParams = false;

export function generateStaticParams() {
  return AR_IDS.map((model) => ({ model }));
}

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
