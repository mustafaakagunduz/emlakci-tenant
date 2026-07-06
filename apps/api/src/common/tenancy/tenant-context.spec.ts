import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { TenantContext } from './tenant-context';
import { JwtPayload } from '../../auth/types/jwt-payload.type';

function makeContext(user?: JwtPayload) {
  const request = { user } as unknown as import('express').Request;
  return new TenantContext(request);
}

describe('TenantContext', () => {
  it('org kullanıcısı için organizationId döner', () => {
    const context = makeContext({
      sub: 'user-1',
      organizationId: 'org-1',
      role: Role.AGENT,
    });

    expect(context.organizationId).toBe('org-1');
  });

  it('scopeWhere where koşuluna organizationId ekler', () => {
    const context = makeContext({
      sub: 'user-1',
      organizationId: 'org-1',
      role: Role.AGENT,
    });

    expect(context.scopeWhere({ deletedAt: null })).toEqual({
      deletedAt: null,
      organizationId: 'org-1',
    });
  });

  it('Super Admin (organizationId=null) için hata fırlatır', () => {
    const context = makeContext({
      sub: 'super-1',
      organizationId: null,
      role: Role.SUPER_ADMIN,
    });

    expect(() => context.organizationId).toThrow(ForbiddenException);
    expect(() => context.scopeWhere({})).toThrow(ForbiddenException);
  });

  it('user hiç yoksa da hata fırlatır', () => {
    const context = makeContext(undefined);
    expect(() => context.organizationId).toThrow(ForbiddenException);
  });
});
