import { Controller, Get, Query } from '@nestjs/common';
import { GeoService } from './geo.service';
import { ForwardGeocodeResult, NominatimService } from './nominatim.service';
import { OverpassService } from './overpass.service';
import { normalizeTurkish } from './geo.util';
import {
  DistrictsQueryDto,
  ForwardGeocodeQueryDto,
  NeighborhoodsQueryDto,
  ProvincesQueryDto,
  StreetsQueryDto,
} from './dto/geo-query.dto';
import { ReverseGeocodeQueryDto } from './dto/reverse-geocode-query.dto';
import { ReverseGeocodeResult } from './geo.types';

@Controller('geo')
export class GeoController {
  constructor(
    private readonly geoService: GeoService,
    private readonly nominatimService: NominatimService,
    private readonly overpassService: OverpassService,
  ) {}

  @Get('provinces')
  provinces(@Query() query: ProvincesQueryDto) {
    return { data: this.geoService.findProvinces(query.q) };
  }

  @Get('districts')
  districts(@Query() query: DistrictsQueryDto) {
    return { data: this.geoService.findDistricts(query.province, query.q) };
  }

  @Get('neighborhoods')
  neighborhoods(@Query() query: NeighborhoodsQueryDto) {
    return {
      data: this.geoService.findNeighborhoods(
        query.province,
        query.district,
        query.q,
      ),
    };
  }

  @Get('reverse')
  async reverse(
    @Query() query: ReverseGeocodeQueryDto,
  ): Promise<ReverseGeocodeResult> {
    const raw = await this.nominatimService.reverse(
      Number(query.lat),
      Number(query.lng),
    );
    const province = this.geoService.matchProvince(raw.province);
    const district = this.geoService.matchDistrict(province, raw.district);
    const neighborhood = this.geoService.matchNeighborhood(
      province,
      district,
      raw.neighborhood,
    );
    return { province, district, neighborhood, street: raw.street ?? null };
  }

  @Get('forward')
  async forward(
    @Query() query: ForwardGeocodeQueryDto,
  ): Promise<ForwardGeocodeResult | null> {
    const parts = [
      query.street,
      query.neighborhood,
      query.district,
      query.province,
      'Türkiye',
    ].filter(Boolean);
    return this.nominatimService.forward(parts.join(', '));
  }

  @Get('streets')
  async streets(@Query() query: StreetsQueryDto): Promise<{ data: string[] }> {
    const bboxQuery = [
      query.neighborhood,
      query.district,
      query.province,
      'Türkiye',
    ].join(', ');
    const bbox = await this.nominatimService.boundingBox(bboxQuery);
    if (!bbox) {
      return { data: [] };
    }

    const cacheKey = `${query.province}|${query.district}|${query.neighborhood}`;
    const allStreets = await this.overpassService.streetsInBoundingBox(cacheKey, bbox);
    const needle = query.q ? normalizeTurkish(query.q) : undefined;
    const filtered = needle
      ? allStreets.filter((s) => normalizeTurkish(s).includes(needle))
      : allStreets;

    return { data: filtered.slice(0, 50) };
  }
}
