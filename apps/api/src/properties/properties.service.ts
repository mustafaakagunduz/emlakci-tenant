import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenancy/tenant-context';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyFilterDto } from './dto/property-filter.dto';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
  ) {}

  /**
   * Tüm okuma sorgularının tek geçiş noktası: organizationId JWT'den
   * (TenantContext.scopeWhere), deletedAt:null merkezi olarak burada eklenir —
   * endpoint'lerde tekrarlanmaz.
   */
  private scopeActive(where: Prisma.PropertyWhereInput = {}): Prisma.PropertyWhereInput {
    return this.tenant.scopeWhere({ ...where, deletedAt: null });
  }

  /**
   * Liste ve harita marker endpoint'inin ortak filtre-to-where çevirisi
   * (PropertyFilterDto Faz 4'teki map-markers endpoint'i için de aynen kullanılır).
   */
  private buildFilterWhere(filters: PropertyFilterDto): Prisma.PropertyWhereInput {
    return {
      ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
      ...(filters.listingType ? { listingType: filters.listingType } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.city ? { city: { equals: filters.city, mode: 'insensitive' } } : {}),
      ...(filters.district ? { district: { equals: filters.district, mode: 'insensitive' } } : {}),
      ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
        ? {
            price: {
              ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
              ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
            },
          }
        : {}),
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: 'insensitive' } },
              { addressText: { contains: filters.q, mode: 'insensitive' } },
              { ownerName: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  async create(dto: CreatePropertyDto, createdById: string) {
    return this.prisma.property.create({
      data: {
        ...dto,
        organizationId: this.tenant.organizationId,
        createdById,
      },
    });
  }

  async findAll(filters: PropertyFilterDto) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const where = this.scopeActive(this.buildFilterWhere(filters));

    const [rows, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: { photos: { where: { isCover: true }, take: 1 } },
      }),
      this.prisma.property.count({ where }),
    ]);

    // Listede tam photos dizisi taşınmaz, yalnızca kapak fotoğrafının URL'i.
    const data = rows.map(({ photos, ...rest }) => ({
      ...rest,
      coverPhotoUrl: photos[0]?.url ?? null,
    }));

    return { data, meta: { page, limit, total } };
  }

  /**
   * Harita için pagination'sız, hafif shape: yalnızca pin çizmek ve özet
   * kartı doldurmak için gereken alanlar. Aynı filtreler, tüm eşleşen
   * kayıtlar (liste ile harita her zaman aynı filtre setine göre senkron).
   */
  async findMapMarkers(filters: PropertyFilterDto) {
    const rows = await this.prisma.property.findMany({
      where: this.scopeActive(this.buildFilterWhere(filters)),
      select: {
        id: true,
        title: true,
        propertyType: true,
        listingType: true,
        status: true,
        price: true,
        currency: true,
        latitude: true,
        longitude: true,
        city: true,
        district: true,
        roomCount: true,
        netM2: true,
        ownerName: true,
        ownerPhone: true,
        photos: { where: { isCover: true }, take: 1, select: { url: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return rows.map(({ photos, ...rest }) => ({
      ...rest,
      coverPhotoUrl: photos[0]?.url ?? null,
    }));
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findFirst({
      where: this.scopeActive({ id }),
      include: { photos: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] } },
    });

    if (!property) {
      throw new NotFoundException('Taşınmaz bulunamadı');
    }

    return property;
  }

  async update(id: string, dto: UpdatePropertyDto) {
    await this.findOne(id);

    return this.prisma.property.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
