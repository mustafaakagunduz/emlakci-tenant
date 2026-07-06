import { User } from '@prisma/client';

export type SafeUser = Omit<User, 'passwordHash'>;

export function toSafeUser(user: User & { organization?: unknown }): SafeUser {
  const { passwordHash: _passwordHash, organization: _organization, ...safeUser } = user;
  return safeUser;
}
