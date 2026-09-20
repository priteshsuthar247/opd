import { DefaultSession } from "next-auth";

// Extends the built-in Auth.js types so `session.user.role` and
// `session.user.id` are typed everywhere (Server Actions, middleware,
// Server Components) instead of falling back to `any`.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "doctor" | "receptionist";
      active: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "doctor" | "receptionist";
    active: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "doctor" | "receptionist";
    active: boolean;
    checkedAt: number;
  }
}
