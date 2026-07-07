export interface Province {
  name: string;
  code: string;
  lat: number;
  lng: number;
}

export interface District {
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

export interface ForwardGeocodeResult {
  lat: number;
  lng: number;
}
