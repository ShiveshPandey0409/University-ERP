import type { Response } from "supertest";

/** Extracts the refresh cookie value from a Set-Cookie response header. */
export function extractRefreshCookie(res: Response): string {
  const cookies = res.headers["set-cookie"] as unknown as string[] | undefined;
  const rt = cookies?.find((c) => c.startsWith("rt="));
  if (!rt) return "";
  return decodeURIComponent(rt.split(";")[0]!.slice("rt=".length));
}
