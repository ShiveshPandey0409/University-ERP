"use client";
import { ResourceManager } from "@/components/ResourceManager";
import { subjectsConfig } from "@/lib/resources";

export default function Page() {
  return <ResourceManager config={subjectsConfig} />;
}
