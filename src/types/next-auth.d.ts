import { DefaultSession } from "next-auth";

export interface DjangoUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string | null;
  department: string | null;
  title: string | null;
  auth_source: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken: string;
    error?: "RefreshTokenError";
    user: DjangoUser;
  }

  interface User extends Omit<DjangoUser, "id"> {
    id: string; // NextAuth base User.id mensyaratkan string -- Django id (number) dikonversi saat authorize()/jwt callback
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    user: DjangoUser;
    error?: "RefreshTokenError";
  }
}
