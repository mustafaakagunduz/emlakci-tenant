import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface NominatimAddress {
  province?: string;
  city?: string;
  town?: string;
  county?: string;
  district?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  road?: string;
  pedestrian?: string;
}

interface RawReverseResult {
  province: string | undefined;
  district: string | undefined;
  neighborhood: string | undefined;
  street: string | undefined;
}

export interface ForwardGeocodeResult {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface NominatimSearchResult {
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string];
}

/** Nominatim (OpenStreetMap) reverse/forward geocoding'i tek noktadan sarar; sonuçları bellekte önbelleğe alır. */
@Injectable()
export class NominatimService {
  private readonly logger = new Logger(NominatimService.name);
  private readonly cache = new Map<string, RawReverseResult>();
  private readonly searchCache = new Map<string, NominatimSearchResult | null>();
  private readonly userAgent: string;

  constructor(private readonly config: ConfigService) {
    this.userAgent =
      this.config.get<string>('NOMINATIM_USER_AGENT') ??
      'EmlakPanel/1.0 (contact: unset)';
  }

  private cacheKey(lat: number, lng: number): string {
    return `${lat.toFixed(4)},${lng.toFixed(4)}`;
  }

  async reverse(lat: number, lng: number): Promise<RawReverseResult> {
    const key = this.cacheKey(lat, lng);
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const result = await this.fetchFromNominatim(lat, lng);
    this.cache.set(key, result);
    return result;
  }

  async forward(query: string): Promise<ForwardGeocodeResult | null> {
    const result = await this.search(query);
    if (!result) return null;
    return { lat: Number(result.lat), lng: Number(result.lon) };
  }

  /** Bir yer adının (mahalle vb.) Nominatim'in döndüğü kaba sınır kutusunu verir; Overpass sorgusu için kullanılır. */
  async boundingBox(query: string): Promise<BoundingBox | null> {
    const result = await this.search(query);
    if (!result?.boundingbox) return null;
    const [south, north, west, east] = result.boundingbox.map(Number);
    return { south, west, north, east };
  }

  private async search(query: string): Promise<NominatimSearchResult | null> {
    const key = query.trim().toLowerCase();
    if (this.searchCache.has(key)) {
      return this.searchCache.get(key) ?? null;
    }

    const result = await this.fetchSearchFromNominatim(query);
    this.searchCache.set(key, result);
    return result;
  }

  private async fetchSearchFromNominatim(
    query: string,
  ): Promise<NominatimSearchResult | null> {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      url.searchParams.set('countrycodes', 'tr');
      url.searchParams.set('accept-language', 'tr');

      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        this.logger.warn(`Nominatim HTTP ${response.status}`);
        return null;
      }

      const body: NominatimSearchResult[] = await response.json();
      return body[0] ?? null;
    } catch (err) {
      this.logger.warn(`Nominatim search failed: ${err}`);
      return null;
    }
  }

  private async fetchFromNominatim(
    lat: number,
    lng: number,
  ): Promise<RawReverseResult> {
    const empty: RawReverseResult = {
      province: undefined,
      district: undefined,
      neighborhood: undefined,
      street: undefined,
    };

    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.searchParams.set('lat', String(lat));
      url.searchParams.set('lon', String(lng));
      url.searchParams.set('format', 'json');
      url.searchParams.set('zoom', '16');
      url.searchParams.set('accept-language', 'tr');

      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        this.logger.warn(`Nominatim HTTP ${response.status}`);
        return empty;
      }

      const body: { address?: NominatimAddress } = await response.json();
      const address = body.address ?? {};

      return {
        province: address.province ?? address.city,
        district: address.county ?? address.district ?? address.town,
        neighborhood:
          address.neighbourhood ?? address.suburb ?? address.quarter,
        street: address.road ?? address.pedestrian,
      };
    } catch (err) {
      this.logger.warn(`Nominatim reverse geocode failed: ${err}`);
      return empty;
    }
  }
}
