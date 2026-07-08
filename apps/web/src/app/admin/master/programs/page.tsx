"use client";
import { ResourceManager } from "@/components/ResourceManager";
import { programsConfig } from "@/lib/resources";

export default function Page() {
  return <ResourceManager config={programsConfig} />;
}
