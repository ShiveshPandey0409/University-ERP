import { describe, expect, it } from "vitest";
import { PERMISSIONS, ROLE_PERMISSIONS } from "./permission-catalog.js";
import { ROLE_KEYS } from "../enums/role-keys.js";

describe("permission catalog", () => {
  it("has no duplicate permission keys", () => {
    expect(new Set(PERMISSIONS).size).toBe(PERMISSIONS.length);
  });

  it("every key is strict module.resource.action (3 segments)", () => {
    for (const key of PERMISSIONS) {
      const segments = key.split(".");
      expect(segments, `"${key}" must have exactly 3 segments`).toHaveLength(3);
      expect(segments.every((s) => s.length > 0)).toBe(true);
    }
  });

  it("defines permissions for all 16 roles", () => {
    for (const role of ROLE_KEYS) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });

  it("only references permissions that exist in the catalog", () => {
    const catalog = new Set<string>(PERMISSIONS);
    for (const role of ROLE_KEYS) {
      const perms = ROLE_PERMISSIONS[role];
      if (perms === "*") continue;
      for (const p of perms) {
        expect(catalog.has(p), `role ${role} references unknown permission ${p}`).toBe(true);
      }
    }
  });

  it("enforces separation of duties", () => {
    // marks_admin can enter marks but cannot approve publication
    const marks = ROLE_PERMISSIONS.marks_admin;
    expect(marks).not.toBe("*");
    if (marks !== "*") {
      expect(marks).toContain("marks.entry.write");
      expect(marks).not.toContain("result.publication.approve");
    }
    // admission_verifier cannot generate merit lists
    const verifier = ROLE_PERMISSIONS.admission_verifier;
    expect(verifier).not.toBe("*");
    if (verifier !== "*") {
      expect(verifier).toContain("admission.application.verify");
      expect(verifier).not.toContain("admission.merit.generate");
    }
  });

  it("grants super_admin the full catalog", () => {
    expect(ROLE_PERMISSIONS.super_admin).toBe("*");
  });
});
