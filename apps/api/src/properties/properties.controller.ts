import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyFilterDto } from './dto/property-filter.dto';

@Roles(Role.ORG_ADMIN, Role.AGENT)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  create(@Body() dto: CreatePropertyDto, @CurrentUser() currentUser: JwtPayload) {
    return this.propertiesService.create(dto, currentUser.sub);
  }

  @Get()
  findAll(@Query() query: PropertyFilterDto) {
    return this.propertiesService.findAll(query);
  }

  // Statik 'map-markers' segmenti ':id' route'undan ÖNCE tanımlanmalı,
  // aksi halde Nest onu bir id parametresi sanıp findOne'a yönlendirir.
  @Get('map-markers')
  findMapMarkers(@Query() query: PropertyFilterDto) {
    return this.propertiesService.findMapMarkers(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.propertiesService.remove(id);
  }
}
