import { apiFetch } from '../../api/client';
import type {
  PaginatedResponse,
  Property,
  PropertyFilters,
  PropertyInput,
  PropertyMarker,
} from './types';

function buildQuery(filters: PropertyFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export function fetchProperties(
  filters: PropertyFilters,
): Promise<PaginatedResponse<Property>> {
  const query = buildQuery(filters);
  return apiFetch(`/properties${query ? `?${query}` : ''}`);
}

export function fetchPropertyMarkers(filters: PropertyFilters): Promise<PropertyMarker[]> {
  const query = buildQuery(filters);
  return apiFetch(`/properties/map-markers${query ? `?${query}` : ''}`);
}

export function fetchProperty(id: string): Promise<Property> {
  return apiFetch(`/properties/${id}`);
}

export function createProperty(input: PropertyInput): Promise<Property> {
  return apiFetch('/properties', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateProperty(id: string, input: Partial<PropertyInput>): Promise<Property> {
  return apiFetch(`/properties/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteProperty(id: string): Promise<void> {
  return apiFetch(`/properties/${id}`, { method: 'DELETE' });
}
