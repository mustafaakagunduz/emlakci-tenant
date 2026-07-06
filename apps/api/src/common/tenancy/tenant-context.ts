import { ForbiddenException, Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';

/**
 * Tenant'a ait verilere (Property, PropertyPhoto vb.) dokunan HER servis
 * sorgusu bu context üzerinden geçmeli — organizationId asla request
 * body/params'tan alınmaz, yalnızca JWT'den (request.user) okunur.
 *
 * Kullanım (Faz 3'te PropertyService örneği):
 *   constructor(private prisma: PrismaService, private tenant: TenantContext) {}
 *   findMany(filters: PropertyFilters) {
 *     return this.prisma.property.findMany({
 *       where: this.tenant.scopeWhere({ ...filters, deletedAt: null }),
 *     });
 *   }
 *
 * Super Admin'in organizationId'si null'dır; scopeWhere/organizationId
 * bilerek hata fırlatır — Super Admin'in portföy verisine hiçbir yoldan
 * erişememesi bu katmanda garanti altına alınır.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  private get user(): JwtPayload | undefined {
    return (this.request as Request & { user?: JwtPayload }).user;
  }

  get organizationId(): string {
    const organizationId = this.user?.organizationId;
    if (!organizationId) {
      throw new ForbiddenException(
        'Bu işlem tenant verisine erişim gerektirir; Super Admin portföy verisi göremez.',
      );
    }
    return organizationId;
  }

  scopeWhere<T extends Record<string, unknown>>(
    where: T = {} as T,
  ): T & { organizationId: string } {
    return { ...where, organizationId: this.organizationId };
  }
}
