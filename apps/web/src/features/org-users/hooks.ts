import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrgUser, fetchOrgUsers, updateOrgUser } from './api';
import type { CreateOrgUserInput, UpdateOrgUserInput } from './types';

const orgUsersKey = ['org-users'] as const;

export function useOrgUsers() {
  return useQuery({ queryKey: orgUsersKey, queryFn: fetchOrgUsers });
}

export function useCreateOrgUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrgUserInput) => createOrgUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgUsersKey });
    },
  });
}

export function useUpdateOrgUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOrgUserInput }) =>
      updateOrgUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgUsersKey });
    },
  });
}
