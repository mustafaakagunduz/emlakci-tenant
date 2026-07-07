import { useQuery } from '@tanstack/react-query';
import { fetchDistricts, fetchNeighborhoods, fetchProvinces, fetchStreets } from './api';

export function useProvinces(q: string) {
  return useQuery({
    queryKey: ['geo', 'provinces', q],
    queryFn: () => fetchProvinces(q),
    select: (res) => res.data,
    staleTime: Infinity,
  });
}

export function useDistricts(province: string, q: string) {
  return useQuery({
    queryKey: ['geo', 'districts', province, q],
    queryFn: () => fetchDistricts(province, q),
    select: (res) => res.data,
    enabled: !!province,
    staleTime: Infinity,
  });
}

export function useNeighborhoods(province: string, district: string, q: string) {
  return useQuery({
    queryKey: ['geo', 'neighborhoods', province, district, q],
    queryFn: () => fetchNeighborhoods(province, district, q),
    select: (res) => res.data,
    enabled: !!province && !!district,
    staleTime: Infinity,
  });
}

export function useStreets(province: string, district: string, neighborhood: string, q: string) {
  return useQuery({
    queryKey: ['geo', 'streets', province, district, neighborhood, q],
    queryFn: () => fetchStreets(province, district, neighborhood, q),
    select: (res) => res.data,
    enabled: !!province && !!district && !!neighborhood,
    staleTime: Infinity,
  });
}
