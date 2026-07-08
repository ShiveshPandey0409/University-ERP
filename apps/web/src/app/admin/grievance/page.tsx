"use client";
import { ResourceManager } from "@/components/ResourceManager";
import { grievancesConfig } from "@/lib/resources";

export default function Page() {
  return <ResourceManager config={grievancesConfig} />;
}
