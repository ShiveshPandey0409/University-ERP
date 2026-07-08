"use client";
import { ResourceManager } from "@/components/ResourceManager";
import { examSessionsConfig } from "@/lib/resources";

export default function Page() {
  return <ResourceManager config={examSessionsConfig} />;
}
