import type { DefaultSession } from "next-auth";
import type { UserRole } from "@tablebook/shared";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
    locale?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    locale?: string;
  }
}
