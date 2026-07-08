"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { visibleNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, status, logout } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login/admin");
  }, [status, router]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const nav = visibleNav(user.permissions);

  return (
    <div className="flex h-screen">
      <aside className="flex w-60 flex-col border-r bg-muted/30">
        <div className="border-b p-4">
          <div className="font-semibold">University ERP</div>
          <div className="text-xs text-muted-foreground">Admin Console</div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                pathname === item.href && "bg-accent font-medium",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b px-6">
          <div className="text-sm text-muted-foreground">
            {user.roles.join(", ")}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{user.displayName}</span>
            <Button variant="outline" size="sm" onClick={() => logout().then(() => router.replace("/login/admin"))}>
              Log out
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
