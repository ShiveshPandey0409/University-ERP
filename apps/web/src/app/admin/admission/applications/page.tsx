"use client";
import { ResourceManager } from "@/components/ResourceManager";
import { admissionsConfig } from "@/lib/resources";

export default function Page() {
  return <ResourceManager config={admissionsConfig} />;
}
