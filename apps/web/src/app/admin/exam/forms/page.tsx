"use client";
import { ResourceManager } from "@/components/ResourceManager";
import { examFormsConfig } from "@/lib/resources";

export default function Page() {
  return <ResourceManager config={examFormsConfig} />;
}
