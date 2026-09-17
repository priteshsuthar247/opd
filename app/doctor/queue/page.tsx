import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DoctorQueue() {
  const session = await auth();
  if (session?.user?.role !== "doctor") redirect("/");

  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Doctor Queue</CardTitle>
          <CardDescription>
            Signed in as {session.user.name ?? session.user.email}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No patients in queue. The live queue board, call-next flow and
            consultation workspace land here in Phase 4.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
