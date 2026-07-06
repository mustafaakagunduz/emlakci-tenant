import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  organizationId: string | null;
  role: Role;
}
