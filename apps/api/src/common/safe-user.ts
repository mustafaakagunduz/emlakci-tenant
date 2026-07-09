import { Organization, User } from '@prisma/client';

export type SafeUser = Omit<User, 'passwordHash'> & { organizationName: string | null };

export function toSafeUser(user: User & { organization?: Organization | null }): SafeUser {
  const { passwordHash: _passwordHash, organization, ...safeUser } = user;
  return { ...safeUser, organizationName: organization?.name ?? null };
}
