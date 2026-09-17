import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminHome() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Administration</CardTitle>
          <CardDescription>
            Signed in as {session.user.name ?? session.user.email}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Department, doctor, medicine, category, billing and queue
            configuration management lands here in Phase 2.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
