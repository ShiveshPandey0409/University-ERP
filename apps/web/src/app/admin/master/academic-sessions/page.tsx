"use client";
import { ResourceManager } from "@/components/ResourceManager";
import { academicSessionsConfig } from "@/lib/resources";

export default function Page() {
  return <ResourceManager config={academicSessionsConfig} />;
}
