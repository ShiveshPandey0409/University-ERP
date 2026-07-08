"use client";
import { ResourceManager } from "@/components/ResourceManager";
import { noticesConfig } from "@/lib/resources";

export default function Page() {
  return <ResourceManager config={noticesConfig} />;
}
