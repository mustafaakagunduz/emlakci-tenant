import type { Role } from '../auth/types';

export interface Organization {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { users: number };
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  organizationId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationDetail extends Omit<Organization, '_count'> {
  users: AdminUser[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface CreateOrganizationInput {
  name: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  isActive?: boolean;
}

export interface CreateOrgUserInput {
  fullName: string;
  email: string;
  password: string;
  role: 'ORG_ADMIN' | 'AGENT';
}

export interface UpdateUserInput {
  fullName?: string;
  isActive?: boolean;
  password?: string;
}
