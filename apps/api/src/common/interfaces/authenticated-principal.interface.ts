import type { UserType } from "@erp/shared";

/** Attached to the request by JwtAuthGuard after a valid access token. */
export interface AuthenticatedPrincipal {
  userId: string;
  userType: UserType;
  sessionId: string;
  roleVersion: number;
}

export interface RequestScopeContext {
  collegeIds: string[];
  departmentIds: string[];
  sessionIds: string[];
  isGlobal: boolean;
}
