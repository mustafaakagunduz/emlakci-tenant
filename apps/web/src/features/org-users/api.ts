import { apiFetch } from '../../api/client';
import type { CreateOrgUserInput, OrgUser, PaginatedResponse, UpdateOrgUserInput } from './types';

export function fetchOrgUsers(): Promise<PaginatedResponse<OrgUser>> {
  return apiFetch('/users?page=1&limit=100');
}

export function createOrgUser(input: CreateOrgUserInput): Promise<OrgUser> {
  return apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateOrgUser(id: string, input: UpdateOrgUserInput): Promise<OrgUser> {
  return apiFetch(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
