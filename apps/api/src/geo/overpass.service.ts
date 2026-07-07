import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BoundingBox } from './nominatim.service';

interface OverpassElement {
  tags?: { name?: string };
}

/** Overpass API (OpenStreetMap) üzerinden bir sınır kutusu içindeki sokak/cadde adlarını çeker; mahalle bazında bellekte önbelleğe alır. */
@Injectable()
export class OverpassService {
  private readonly logger = new Logger(OverpassService.name);
  private readonly cache = new Map<string, string[]>();
  private readonly userAgent: string;

  constructor(private readonly config: ConfigService) {
    this.userAgent =
      this.config.get<string>('NOMINATIM_USER_AGENT') ??
      'EmlakPanel/1.0 (contact: unset)';
  }

  async streetsInBoundingBox(cacheKey: string, bbox: BoundingBox): Promise<string[]> {
    const key = cacheKey.trim().toLowerCase();
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const streets = await this.fetchStreets(bbox);
    this.cache.set(key, streets);
    return streets;
  }

  private async fetchStreets(bbox: BoundingBox): Promise<string[]> {
    const query = `[out:json][timeout:15];way["highway"]["name"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});out tags;`;

    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        this.logger.warn(`Overpass HTTP ${response.status}`);
        return [];
      }

      const body: { elements?: OverpassElement[] } = await response.json();
      const names = new Set<string>();
      for (const element of body.elements ?? []) {
        if (element.tags?.name) {
          names.add(element.tags.name);
        }
      }

      return [...names].sort((a, b) => a.localeCompare(b, 'tr'));
    } catch (err) {
      this.logger.warn(`Overpass query failed: ${err}`);
      return [];
    }
  }
}
