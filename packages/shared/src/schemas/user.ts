import { z } from "zod";
import { userTypeSchema } from "../enums/user-type.js";
import { roleKeySchema } from "../enums/role-keys.js";

export const activeContextSchema = z.object({
  collegeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
});
export type ActiveContext = z.infer<typeof activeContextSchema>;

export const authUserSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  userType: userTypeSchema,
  roles: z.array(roleKeySchema),
  permissions: z.array(z.string()),
  activeContext: activeContextSchema.optional(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const createUserSchema = z.object({
  userType: userTypeSchema,
  username: z.string().min(3).max(64),
  email: z.string().email().optional(),
  displayName: z.string().min(1).max(128),
  password: z.string().min(8).max(128),
  roleKeys: z.array(roleKeySchema).default([]),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  displayName: z.string().min(1).max(128).optional(),
  status: z.enum(["active", "disabled", "locked", "pending"]).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const assignRolesSchema = z.object({
  roleKeys: z.array(roleKeySchema),
});
export type AssignRolesInput = z.infer<typeof assignRolesSchema>;
