export interface ProvinceRecord {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export interface DistrictRecord {
  id: number;
  name: string;
  provinceId: number;
  lat: number | null;
  lng: number | null;
}

export interface NeighborhoodRecord {
  id: number;
  name: string;
  provinceId: number;
  districtId: number;
}

export interface ProvinceDto {
  name: string;
  code: string;
  lat: number;
  lng: number;
}

export interface DistrictDto {
  name: string;
  code: string;
  lat: number | null;
  lng: number | null;
}

export interface ReverseGeocodeResult {
  province: string | null;
  district: string | null;
  neighborhood: string | null;
  street: string | null;
}
