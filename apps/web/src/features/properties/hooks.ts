import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProperty,
  deleteProperty,
  fetchProperties,
  fetchProperty,
  fetchPropertyMarkers,
  updateProperty,
} from './api';
import type { PropertyFilters, PropertyInput } from './types';

const propertiesKey = (filters: PropertyFilters) => ['properties', filters] as const;
const propertyKey = (id: string) => ['properties', 'detail', id] as const;
const markersKey = (filters: PropertyFilters) => ['properties', 'map', filters] as const;

export function useProperties(filters: PropertyFilters) {
  return useQuery({
    queryKey: propertiesKey(filters),
    queryFn: () => fetchProperties(filters),
  });
}

export function usePropertyMarkers(filters: PropertyFilters) {
  return useQuery({
    queryKey: markersKey(filters),
    queryFn: () => fetchPropertyMarkers(filters),
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKey(id),
    queryFn: () => fetchProperty(id),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PropertyInput) => createProperty(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useUpdateProperty(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<PropertyInput>) => updateProperty(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}
