"use client";
import { ResourceManager } from "@/components/ResourceManager";
import { departmentsConfig } from "@/lib/resources";

export default function Page() {
  return <ResourceManager config={departmentsConfig} />;
}
