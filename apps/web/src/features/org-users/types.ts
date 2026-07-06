import type { Role } from '../auth/types';

export interface OrgUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  organizationId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface CreateOrgUserInput {
  fullName: string;
  email: string;
  password: string;
  role: 'ORG_ADMIN' | 'AGENT';
}

export interface UpdateOrgUserInput {
  fullName?: string;
  isActive?: boolean;
  password?: string;
}
