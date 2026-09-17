"use client";

import { signOut } from "next-auth/react";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      onClick={() => void signOut({ redirectTo: "/login" })}
    >
      <LogOutIcon />
      Sign out
    </Button>
  );
}
