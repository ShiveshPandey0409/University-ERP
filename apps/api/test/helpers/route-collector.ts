import { RequestMethod, type INestApplication } from "@nestjs/common";
import { PATH_METADATA, METHOD_METADATA } from "@nestjs/common/constants";
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core";
import {
  AUTH_ONLY_KEY,
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
} from "../../src/common/constants/metadata-keys.js";

export interface CollectedRoute {
  method: string;
  path: string;
  isPublic: boolean;
  authOnly: boolean;
  permissions: string[];
}

/** Enumerates every registered route from the live DI container, with its
 * authorization metadata. Because it reads the container (not a hardcoded
 * list), a new controller is covered automatically. */
export function collectRoutes(app: INestApplication, globalPrefix = "/api"): CollectedRoute[] {
  const discovery = app.get(DiscoveryService);
  const scanner = app.get(MetadataScanner);
  const reflector = app.get(Reflector);

  const routes: CollectedRoute[] = [];
  for (const wrapper of discovery.getControllers()) {
    const { instance, metatype } = wrapper;
    if (!instance || !metatype) continue;

    const controllerPath = normalize(Reflect.getMetadata(PATH_METADATA, metatype) ?? "");
    const prototype = Object.getPrototypeOf(instance);

    for (const methodName of scanner.getAllMethodNames(prototype)) {
      const handler = prototype[methodName];
      const methodPath = Reflect.getMetadata(PATH_METADATA, handler);
      const httpMethod = Reflect.getMetadata(METHOD_METADATA, handler);
      if (methodPath === undefined || httpMethod === undefined) continue;

      routes.push({
        method: RequestMethod[httpMethod] ?? "GET",
        path: joinPath(globalPrefix, controllerPath, normalize(methodPath)),
        isPublic: Boolean(reflector.getAllAndOverride(IS_PUBLIC_KEY, [handler, metatype])),
        authOnly: Boolean(reflector.getAllAndOverride(AUTH_ONLY_KEY, [handler, metatype])),
        permissions: reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [handler, metatype]) ?? [],
      });
    }
  }
  return routes;
}

function normalize(path: string): string {
  return path.replace(/^\/+|\/+$/g, "");
}

function joinPath(...parts: string[]): string {
  const joined = parts.filter(Boolean).join("/");
  return "/" + joined.replace(/\/+/g, "/").replace(/^\/+/, "");
}
