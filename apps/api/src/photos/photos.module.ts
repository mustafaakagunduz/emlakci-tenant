import { Module } from '@nestjs/common';
import { PropertiesModule } from '../properties/properties.module';
import { PropertyPhotosController } from './property-photos.controller';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { CloudinaryService } from './cloudinary.service';

@Module({
  imports: [PropertiesModule],
  controllers: [PropertyPhotosController, PhotosController],
  providers: [PhotosService, CloudinaryService],
})
export class PhotosModule {}
