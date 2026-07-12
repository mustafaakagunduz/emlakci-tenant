import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { PublicPropertiesService } from './public-properties.service';

@Public()
@Controller('public/properties')
export class PublicPropertiesController {
  constructor(private readonly publicPropertiesService: PublicPropertiesService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.publicPropertiesService.findOne(id);
  }
}
