export type PropertyType =
  | 'APARTMENT'
  | 'SHOP'
  | 'LAND'
  | 'VILLA'
  | 'OFFICE'
  | 'BUILDING'
  | 'OTHER';

export type ListingType = 'SALE' | 'RENT';

export type PropertyStatus = 'ACTIVE' | 'SOLD' | 'RENTED' | 'PASSIVE';

export interface PropertyPhoto {
  id: string;
  propertyId: string;
  cloudinaryPublicId: string;
  url: string;
  isCover: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface PhotoSignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export interface Property {
  id: string;
  organizationId: string;
  createdById: string;
  title: string;
  propertyType: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  price: string;
  currency: string;
  city: string;
  district: string;
  neighborhood: string;
  street: string | null;
  addressText: string;
  latitude: number;
  longitude: number;
  description: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  roomCount: string | null;
  grossM2: number | null;
  netM2: number | null;
  buildingAge: number | null;
  floor: number | null;
  totalFloors: number | null;
  heatingType: string | null;
  monthlyFee: string | null;
  isFurnished: boolean | null;
  zoningStatus: string | null;
  blockNo: string | null;
  parcelNo: string | null;
  createdAt: string;
  updatedAt: string;
  // Yalnızca liste/map-markers cevabında (kapak URL'i, hafif shape)
  coverPhotoUrl?: string | null;
  // Yalnızca detay cevabında (GET /properties/:id, tam dizi)
  photos?: PropertyPhoto[];
}

export interface PublicPropertyPhoto {
  id: string;
  url: string;
  isCover: boolean;
  sortOrder: number;
}

export interface PublicProperty {
  id: string;
  title: string;
  propertyType: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  price: string;
  currency: string;
  city: string;
  district: string;
  neighborhood: string;
  street: string | null;
  addressText: string;
  latitude: number;
  longitude: number;
  description: string | null;
  roomCount: string | null;
  grossM2: number | null;
  netM2: number | null;
  buildingAge: number | null;
  floor: number | null;
  totalFloors: number | null;
  heatingType: string | null;
  monthlyFee: string | null;
  isFurnished: boolean | null;
  zoningStatus: string | null;
  blockNo: string | null;
  parcelNo: string | null;
  createdAt: string;
  photos: PublicPropertyPhoto[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface PropertyFilters {
  q?: string;
  propertyType?: PropertyType;
  listingType?: ListingType;
  status?: PropertyStatus;
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface PropertyMarker {
  id: string;
  title: string;
  propertyType: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  price: string;
  currency: string;
  latitude: number;
  longitude: number;
  city: string;
  district: string;
  roomCount: string | null;
  netM2: number | null;
  ownerName: string | null;
  ownerPhone: string | null;
  coverPhotoUrl: string | null;
}

export interface PropertyInput {
  title: string;
  propertyType: PropertyType;
  listingType: ListingType;
  status?: PropertyStatus;
  price: number;
  currency?: string;
  city: string;
  district: string;
  neighborhood: string;
  street?: string;
  addressText: string;
  latitude: number;
  longitude: number;
  description?: string;
  ownerName?: string;
  ownerPhone?: string;
  roomCount?: string;
  grossM2?: number;
  netM2?: number;
  buildingAge?: number;
  floor?: number;
  totalFloors?: number;
  heatingType?: string;
  monthlyFee?: number;
  isFurnished?: boolean;
  zoningStatus?: string;
  blockNo?: string;
  parcelNo?: string;
}
