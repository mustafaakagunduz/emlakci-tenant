import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { toSafeUser } from '../common/safe-user';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateOrganizationDto) {
    return this.prisma.organization.create({ data: { name: dto.name } });
  }

  async findAll(query: PaginationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const [data, total] = await Promise.all([
      this.prisma.organization.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { users: true } } },
      }),
      this.prisma.organization.count(),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: { users: { orderBy: { createdAt: 'asc' } } },
    });

    if (!organization) {
      throw new NotFoundException('Organizasyon bulunamadı');
    }

    const { users, ...rest } = organization;
    return { ...rest, users: users.map(toSafeUser) };
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.ensureExists(id);

    return this.prisma.organization.update({
      where: { id },
      data: dto,
    });
  }

  private async ensureExists(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException('Organizasyon bulunamadı');
    }

    return organization;
  }
}
