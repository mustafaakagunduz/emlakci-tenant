import { Module } from '@nestjs/common';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { NominatimService } from './nominatim.service';
import { OverpassService } from './overpass.service';

@Module({
  controllers: [GeoController],
  providers: [GeoService, NominatimService, OverpassService],
})
export class GeoModule {}
