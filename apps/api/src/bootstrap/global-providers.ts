import type { Provider } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { PermissionsGuard } from "../common/guards/permissions.guard.js";
import { ScopeGuard } from "../common/guards/scope.guard.js";
import { NoStoreInterceptor } from "../common/interceptors/no-store.interceptor.js";
import { AuditInterceptor } from "../common/interceptors/audit.interceptor.js";
import { AllExceptionsFilter } from "../common/filters/all-exceptions.filter.js";

/** Registered globally so the default for EVERY route is deny. Guard order
 * matters: authenticate → authorize → scope. */
export const globalProviders: Provider[] = [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: PermissionsGuard },
  { provide: APP_GUARD, useClass: ScopeGuard },
  { provide: APP_INTERCEPTOR, useClass: NoStoreInterceptor },
  { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  { provide: APP_FILTER, useClass: AllExceptionsFilter },
];
