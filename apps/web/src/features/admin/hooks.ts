import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createOrgUser,
  createOrganization,
  fetchOrganization,
  fetchOrganizations,
  updateOrganization,
  updateUser,
} from './api';
import type {
  CreateOrganizationInput,
  CreateOrgUserInput,
  UpdateOrganizationInput,
  UpdateUserInput,
} from './types';

const organizationsKey = ['organizations'] as const;
const organizationKey = (id: string) => ['organizations', id] as const;

export function useOrganizations() {
  return useQuery({ queryKey: organizationsKey, queryFn: fetchOrganizations });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: organizationKey(id),
    queryFn: () => fetchOrganization(id),
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => createOrganization(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKey });
    },
  });
}

export function useUpdateOrganization(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => updateOrganization(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKey });
      queryClient.invalidateQueries({ queryKey: organizationKey(id) });
    },
  });
}

export function useCreateOrgUser(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrgUserInput) => createOrgUser(organizationId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKey(organizationId) });
      queryClient.invalidateQueries({ queryKey: organizationsKey });
    },
  });
}

export function useUpdateUser(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => updateUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKey(organizationId) });
    },
  });
}
