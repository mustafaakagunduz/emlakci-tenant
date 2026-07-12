import { Module } from '@nestjs/common';
import { PublicPropertiesController } from './public-properties.controller';
import { PublicPropertiesService } from './public-properties.service';

@Module({
  controllers: [PublicPropertiesController],
  providers: [PublicPropertiesService],
})
export class PublicPropertiesModule {}
