import { PrismaClient, type UserType } from "@prisma/client";
import * as argon2 from "argon2";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_KEYS,
  type RoleKey,
} from "@erp/shared";
import { seedSampleData } from "./sample-data.js";

const prisma = new PrismaClient();

const ROLE_NAMES: Record<RoleKey, string> = {
  super_admin: "Super Admin",
  university_admin: "University Admin",
  admission_admin: "Admission Admin",
  admission_verifier: "Admission Verifier",
  enrollment_admin: "Enrollment Admin",
  academic_admin: "Academic Admin",
  exam_admin: "Examination Admin",
  marks_admin: "Marks Admin",
  finance_admin: "Finance Admin",
  grievance_admin: "Grievance Admin",
  notice_admin: "Notice Admin",
  college_admin: "College Admin",
  college_exam_operator: "College Exam Operator",
  college_marks_operator: "College Marks Operator",
  student: "Student",
  applicant: "Applicant",
};

async function seedPermissions() {
  for (const key of PERMISSIONS) {
    const [module, resource, action] = key.split(".");
    if (!module || !resource || !action) {
      throw new Error(`Permission key "${key}" must be module.resource.action`);
    }
    await prisma.permission.upsert({
      where: { key },
      update: { module, resource, action },
      create: { key, module, resource, action },
    });
  }
  console.log(`  ✓ ${PERMISSIONS.length} permissions`);
}

async function seedRoles() {
  const allPermissions = await prisma.permission.findMany({ select: { id: true, key: true } });
  const permIdByKey = new Map(allPermissions.map((p) => [p.key, p.id]));

  for (const roleKey of ROLE_KEYS) {
    const role = await prisma.role.upsert({
      where: { key: roleKey },
      update: { name: ROLE_NAMES[roleKey], isSystem: true },
      create: { key: roleKey, name: ROLE_NAMES[roleKey], isSystem: true },
    });

    const grant = ROLE_PERMISSIONS[roleKey];
    const permKeys = grant === "*" ? PERMISSIONS : grant;
    const desiredIds = new Set(
      permKeys.map((k) => permIdByKey.get(k)).filter((v): v is string => Boolean(v)),
    );

    const existing = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permissionId: true },
    });
    const existingIds = new Set(existing.map((e) => e.permissionId));

    // Add missing
    const toAdd = [...desiredIds].filter((id) => !existingIds.has(id));
    if (toAdd.length) {
      await prisma.rolePermission.createMany({
        data: toAdd.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
    // Remove stale (converge to desired)
    const toRemove = [...existingIds].filter((id) => !desiredIds.has(id));
    if (toRemove.length) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id, permissionId: { in: toRemove } },
      });
    }
  }
  console.log(`  ✓ ${ROLE_KEYS.length} roles + permission mappings`);
}

async function seedSuperAdmin() {
  const username = process.env.SEED_SUPERADMIN_USERNAME;
  const password = process.env.SEED_SUPERADMIN_PASSWORD;
  const email = process.env.SEED_SUPERADMIN_EMAIL ?? null;
  if (!username || !password) {
    console.log("  · SEED_SUPERADMIN_* not set — skipping bootstrap user");
    return;
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await prisma.user.upsert({
    where: { userType_username: { userType: "admin" as UserType, username } },
    update: { email, status: "active", displayName: "Super Admin" },
    create: {
      userType: "admin",
      username,
      email,
      passwordHash,
      displayName: "Super Admin",
      status: "active",
      mfaEnabled: false,
    },
  });

  const superRole = await prisma.role.findUniqueOrThrow({ where: { key: "super_admin" } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superRole.id } },
    update: {},
    create: { userId: user.id, roleId: superRole.id },
  });
  console.log(`  ✓ super_admin user "${username}"`);
}

async function seedDevCollegeUser() {
  if (process.env.NODE_ENV === "production") return;
  const username = "college1";
  const passwordHash = await argon2.hash("ChangeMe!2026", { type: argon2.argon2id });
  const user = await prisma.user.upsert({
    where: { userType_username: { userType: "college" as UserType, username } },
    update: { status: "active" },
    create: {
      userType: "college",
      username,
      email: "college1@erp.local",
      passwordHash,
      displayName: "Demo College 1",
      status: "active",
    },
  });
  const collegeRole = await prisma.role.findUniqueOrThrow({ where: { key: "college_admin" } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: collegeRole.id } },
    update: {},
    create: { userId: user.id, roleId: collegeRole.id },
  });
  // Scope is attached to a real college in the Stage D master-data seed.
  console.log(`  ✓ dev college user "${username}"`);
}

async function main() {
  console.log("Seeding identity + RBAC…");
  await seedPermissions();
  await seedRoles();
  await seedSuperAdmin();
  await seedDevCollegeUser();
  if (process.env.NODE_ENV !== "production") {
    await seedSampleData(prisma);
  }
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
