import { apiFetch } from '../../api/client';
import type { District, ForwardGeocodeResult, Province, ReverseGeocodeResult } from './types';

export function fetchProvinces(q?: string): Promise<{ data: Province[] }> {
  const params = q ? `?q=${encodeURIComponent(q)}` : '';
  return apiFetch(`/geo/provinces${params}`);
}

export function fetchDistricts(province: string, q?: string): Promise<{ data: District[] }> {
  const params = new URLSearchParams({ province });
  if (q) params.set('q', q);
  return apiFetch(`/geo/districts?${params.toString()}`);
}

export function fetchNeighborhoods(
  province: string,
  district: string,
  q?: string,
): Promise<{ data: string[] }> {
  const params = new URLSearchParams({ province, district });
  if (q) params.set('q', q);
  return apiFetch(`/geo/neighborhoods?${params.toString()}`);
}

export function fetchReverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  return apiFetch(`/geo/reverse?${params.toString()}`);
}

export function fetchForwardGeocode(params: {
  province: string;
  district: string;
  neighborhood?: string;
  street?: string;
}): Promise<ForwardGeocodeResult | null> {
  const search = new URLSearchParams({ province: params.province, district: params.district });
  if (params.neighborhood) search.set('neighborhood', params.neighborhood);
  if (params.street) search.set('street', params.street);
  return apiFetch(`/geo/forward?${search.toString()}`);
}

export function fetchStreets(
  province: string,
  district: string,
  neighborhood: string,
  q?: string,
): Promise<{ data: string[] }> {
  const params = new URLSearchParams({ province, district, neighborhood });
  if (q) params.set('q', q);
  return apiFetch(`/geo/streets?${params.toString()}`);
}
