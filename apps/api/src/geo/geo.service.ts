import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  DistrictDto,
  DistrictRecord,
  NeighborhoodRecord,
  ProvinceDto,
  ProvinceRecord,
} from './geo.types';
import { normalizeTurkish, stripNeighborhoodSuffix } from './geo.util';

const DATA_DIR = join(__dirname, 'data');

@Injectable()
export class GeoService {
  private readonly provinces: ProvinceRecord[];
  private readonly districts: DistrictRecord[];
  private readonly neighborhoods: NeighborhoodRecord[];
  private readonly provinceById = new Map<number, ProvinceRecord>();
  private readonly districtsByProvinceId = new Map<number, DistrictRecord[]>();
  private readonly neighborhoodsByDistrictId = new Map<
    number,
    NeighborhoodRecord[]
  >();

  constructor() {
    this.provinces = JSON.parse(
      readFileSync(join(DATA_DIR, 'provinces.json'), 'utf8'),
    );
    this.districts = JSON.parse(
      readFileSync(join(DATA_DIR, 'districts.json'), 'utf8'),
    );
    this.neighborhoods = JSON.parse(
      readFileSync(join(DATA_DIR, 'neighborhoods.json'), 'utf8'),
    );

    for (const province of this.provinces) {
      this.provinceById.set(province.id, province);
    }
    for (const district of this.districts) {
      const list = this.districtsByProvinceId.get(district.provinceId) ?? [];
      list.push(district);
      this.districtsByProvinceId.set(district.provinceId, list);
    }
    for (const neighborhood of this.neighborhoods) {
      const list =
        this.neighborhoodsByDistrictId.get(neighborhood.districtId) ?? [];
      list.push(neighborhood);
      this.neighborhoodsByDistrictId.set(neighborhood.districtId, list);
    }
  }

  private toProvinceDto(province: ProvinceRecord): ProvinceDto {
    return {
      name: province.name,
      code: String(province.id).padStart(2, '0'),
      lat: province.lat,
      lng: province.lng,
    };
  }

  private toDistrictDto(district: DistrictRecord): DistrictDto {
    return {
      name: district.name,
      code: String(district.id),
      lat: district.lat,
      lng: district.lng,
    };
  }

  findProvinces(q?: string): ProvinceDto[] {
    const needle = q ? normalizeTurkish(q) : undefined;
    return this.provinces
      .filter((p) => !needle || normalizeTurkish(p.name).includes(needle))
      .map((p) => this.toProvinceDto(p));
  }

  findProvinceByName(name: string): ProvinceRecord | undefined {
    const needle = normalizeTurkish(name);
    return this.provinces.find((p) => normalizeTurkish(p.name) === needle);
  }

  findDistricts(provinceName: string, q?: string): DistrictDto[] {
    const province = this.findProvinceByName(provinceName);
    if (!province) {
      return [];
    }
    const districts = this.districtsByProvinceId.get(province.id) ?? [];
    const needle = q ? normalizeTurkish(q) : undefined;
    return districts
      .filter((d) => !needle || normalizeTurkish(d.name).includes(needle))
      .map((d) => this.toDistrictDto(d));
  }

  findDistrictByName(
    provinceName: string,
    districtName: string,
  ): DistrictRecord | undefined {
    const province = this.findProvinceByName(provinceName);
    if (!province) {
      return undefined;
    }
    const needle = normalizeTurkish(districtName);
    return (this.districtsByProvinceId.get(province.id) ?? []).find(
      (d) => normalizeTurkish(d.name) === needle,
    );
  }

  findNeighborhoods(
    provinceName: string,
    districtName: string,
    q?: string,
    limit = 20,
  ): string[] {
    const district = this.findDistrictByName(provinceName, districtName);
    if (!district) {
      return [];
    }
    const neighborhoods = this.neighborhoodsByDistrictId.get(district.id) ?? [];
    const needle = q ? normalizeTurkish(q) : undefined;
    return neighborhoods
      .filter((n) => !needle || normalizeTurkish(n.name).includes(needle))
      .slice(0, limit)
      .map((n) => n.name);
  }

  /** Nominatim'in serbest metin adres bileşenlerini yerel veri setiyle eşleştirir. */
  matchProvince(name: string | undefined): string | null {
    if (!name) return null;
    return this.findProvinceByName(name)?.name ?? null;
  }

  matchDistrict(
    provinceName: string | null,
    districtName: string | undefined,
  ): string | null {
    if (!provinceName || !districtName) return null;
    return this.findDistrictByName(provinceName, districtName)?.name ?? null;
  }

  matchNeighborhood(
    provinceName: string | null,
    districtName: string | null,
    neighborhoodName: string | undefined,
  ): string | null {
    if (!provinceName || !districtName || !neighborhoodName) return null;
    const district = this.findDistrictByName(provinceName, districtName);
    if (!district) return null;
    const needle = normalizeTurkish(stripNeighborhoodSuffix(neighborhoodName));
    const match = (this.neighborhoodsByDistrictId.get(district.id) ?? []).find(
      (n) => normalizeTurkish(n.name) === needle,
    );
    return match?.name ?? null;
  }
}
