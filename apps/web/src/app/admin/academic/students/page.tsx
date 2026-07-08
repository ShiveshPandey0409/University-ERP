"use client";
import { ResourceManager } from "@/components/ResourceManager";
import { studentsConfig } from "@/lib/resources";

export default function Page() {
  return <ResourceManager config={studentsConfig} />;
}
