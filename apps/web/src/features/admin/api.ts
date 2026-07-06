import { apiFetch } from '../../api/client';
import type {
  AdminUser,
  CreateOrganizationInput,
  CreateOrgUserInput,
  Organization,
  OrganizationDetail,
  PaginatedResponse,
  UpdateOrganizationInput,
  UpdateUserInput,
} from './types';

export function fetchOrganizations(): Promise<PaginatedResponse<Organization>> {
  return apiFetch('/organizations?page=1&limit=100');
}

export function fetchOrganization(id: string): Promise<OrganizationDetail> {
  return apiFetch(`/organizations/${id}`);
}

export function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
  return apiFetch('/organizations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateOrganization(
  id: string,
  input: UpdateOrganizationInput,
): Promise<Organization> {
  return apiFetch(`/organizations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function createOrgUser(
  organizationId: string,
  input: CreateOrgUserInput,
): Promise<AdminUser> {
  return apiFetch(`/organizations/${organizationId}/users`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateUser(id: string, input: UpdateUserInput): Promise<AdminUser> {
  return apiFetch(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
