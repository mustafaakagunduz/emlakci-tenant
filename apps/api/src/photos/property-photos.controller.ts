import { Body, Controller, Param, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { PhotosService } from './photos.service';
import { CreatePhotoDto } from './dto/create-photo.dto';

@Roles(Role.ORG_ADMIN, Role.AGENT)
@Controller('properties/:propertyId/photos')
export class PropertyPhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post('signature')
  createSignature(@Param('propertyId') propertyId: string) {
    return this.photosService.createSignature(propertyId);
  }

  @Post()
  create(@Param('propertyId') propertyId: string, @Body() dto: CreatePhotoDto) {
    return this.photosService.create(propertyId, dto);
  }
}
