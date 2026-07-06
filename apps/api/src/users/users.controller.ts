import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { UsersService } from './users.service';
import { CreateOrgUserDto } from './dto/create-org-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.SUPER_ADMIN)
  @Post('organizations/:id/users')
  createInOrganization(
    @Param('id') organizationId: string,
    @Body() dto: CreateOrgUserDto,
  ) {
    return this.usersService.createInOrganization(organizationId, dto);
  }

  @Roles(Role.ORG_ADMIN)
  @Post('users')
  createInOwnOrganization(
    @Body() dto: CreateOrgUserDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.usersService.createInOwnOrganization(dto, currentUser);
  }

  @Roles(Role.ORG_ADMIN)
  @Get('users')
  findAllInOwnOrganization(
    @Query() query: PaginationQueryDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.usersService.findAllInOwnOrganization(query, currentUser);
  }

  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN)
  @Patch('users/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.usersService.update(id, dto, currentUser);
  }
}
