import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrgUserDto } from './dto/create-org-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { toSafeUser } from '../common/safe-user';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createInOrganization(organizationId: string, dto: CreateOrgUserDto) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organizasyon bulunamadı');
    }

    return this.createUser(organizationId, dto);
  }

  async createInOwnOrganization(dto: CreateOrgUserDto, currentUser: JwtPayload) {
    return this.createUser(this.requireOrganizationId(currentUser), dto);
  }

  async findAllInOwnOrganization(query: PaginationQueryDto, currentUser: JwtPayload) {
    const organizationId = this.requireOrganizationId(currentUser);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const where: Prisma.UserWhereInput = { organizationId };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users.map(toSafeUser), meta: { page, limit, total } };
  }

  async update(id: string, dto: UpdateUserDto, currentUser: JwtPayload) {
    const where: Prisma.UserWhereInput =
      currentUser.role === Role.SUPER_ADMIN
        ? { id }
        : { id, organizationId: this.requireOrganizationId(currentUser) };

    const user = await this.prisma.user.findFirst({ where });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (id === currentUser.sub && dto.isActive === false) {
      throw new ForbiddenException('Kendi hesabınızı pasifleştiremezsiniz');
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password !== undefined) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({ where: { id }, data });
    return toSafeUser(updated);
  }

  private async createUser(organizationId: string, dto: CreateOrgUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          passwordHash,
          role: dto.role,
          organizationId,
        },
      });
      return toSafeUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Bu e-posta adresi zaten kayıtlı');
      }
      throw error;
    }
  }

  private requireOrganizationId(currentUser: JwtPayload): string {
    if (!currentUser.organizationId) {
      throw new ForbiddenException('Bu işlem bir organizasyon bağlamı gerektirir');
    }
    return currentUser.organizationId;
  }
}
