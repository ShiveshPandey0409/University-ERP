"use client";
import { ResourceManager } from "@/components/ResourceManager";
import { facultiesConfig } from "@/lib/resources";

export default function Page() {
  return <ResourceManager config={facultiesConfig} />;
}
