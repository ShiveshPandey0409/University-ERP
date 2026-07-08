"use client";
import { ResourceManager } from "@/components/ResourceManager";
import { enrollmentsConfig } from "@/lib/resources";

export default function Page() {
  return <ResourceManager config={enrollmentsConfig} />;
}
