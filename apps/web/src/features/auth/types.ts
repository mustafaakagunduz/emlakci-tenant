export type Role = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'AGENT';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  organizationId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
