import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="font-semibold">University ERP</div>
          <nav className="flex items-center gap-2">
            <Link href="/results">
              <Button variant="ghost" size="sm">Results</Button>
            </Link>
            <Link href="/login/admin">
              <Button variant="outline" size="sm">Admin Login</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Welcome to the University Portal</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Check published examination results, or sign in to the administration console.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Examination Results</CardTitle>
              <CardDescription>Look up your result by enrollment and roll number.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/results">
                <Button>Check Result</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Administration</CardTitle>
              <CardDescription>Staff sign-in for university operations.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login/admin">
                <Button variant="outline">Admin Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
