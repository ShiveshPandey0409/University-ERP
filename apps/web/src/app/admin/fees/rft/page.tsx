"use client";
import { ResourceManager } from "@/components/ResourceManager";
import { feesRftConfig } from "@/lib/resources";

export default function Page() {
  return <ResourceManager config={feesRftConfig} />;
}
