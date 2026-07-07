import { Controller, Delete, HttpCode, Param, Patch } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { PhotosService } from './photos.service';

@Roles(Role.ORG_ADMIN, Role.AGENT)
@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Patch(':photoId/cover')
  setCover(@Param('photoId') photoId: string) {
    return this.photosService.setCover(photoId);
  }

  @Delete(':photoId')
  @HttpCode(204)
  async remove(@Param('photoId') photoId: string) {
    await this.photosService.remove(photoId);
  }
}
