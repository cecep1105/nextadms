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
  // Izin fitur granular utk user NON-staff (lihat iclock/models.py::FeaturePermission
  // & dashboard Django "Kelola Izin User") -- staff/superuser SELALU true.
  can_transfer_finger: boolean;
  can_view_attendance_recap: boolean;
  can_view_attendance_recap_kantin: boolean;
  can_view_attendance_recap_driver: boolean;
  can_view_dhcp_lease: boolean;
  can_view_fwfilter: boolean;
  can_view_netwatch: boolean;
  can_view_ad_users: boolean;
  can_view_ad_locked_users: boolean;
  can_view_ad_dns: boolean;
  can_view_ad_groups: boolean;
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
