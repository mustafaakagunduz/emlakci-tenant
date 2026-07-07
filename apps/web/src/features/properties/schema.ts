import { z } from 'zod';

export const propertyTypes = [
  'APARTMENT',
  'SHOP',
  'LAND',
  'VILLA',
  'OFFICE',
  'BUILDING',
  'OTHER',
] as const;

export const listingTypes = ['SALE', 'RENT'] as const;

export const propertyStatuses = ['ACTIVE', 'SOLD', 'RENTED', 'PASSIVE'] as const;

// Boş bırakılmış number input'ları RHF'den '' olarak gelir; z.coerce.number
// bunu 0'a çevirip .positive() gibi kuralları kırar. Optional numeric alanlar
// için önce '' -> undefined'a çeviriyoruz ki alan gerçekten boşsa optional kalsın.
function optionalNumber<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    schema.optional(),
  );
}

export const propertySchema = z
  .object({
    title: z.string().min(1, 'errors.titleRequired'),
    propertyType: z.enum(propertyTypes),
    listingType: z.enum(listingTypes),
    status: z.enum(propertyStatuses),
    price: z.coerce.number({ error: 'errors.priceRequired' }).positive('errors.pricePositive'),
    currency: z.string().min(1),
    city: z.string().min(1, 'errors.cityRequired'),
    district: z.string().min(1, 'errors.districtRequired'),
    neighborhood: z.string().min(1, 'errors.neighborhoodRequired'),
    street: z.string().optional(),
    addressText: z.string().min(1, 'errors.addressRequired'),
    latitude: z.number({ error: 'errors.locationRequired' }),
    longitude: z.number({ error: 'errors.locationRequired' }),
    description: z.string().optional(),
    ownerName: z.string().optional(),
    ownerPhone: z.string().optional(),
    roomCount: z.string().optional(),
    grossM2: optionalNumber(z.coerce.number().positive()),
    netM2: optionalNumber(z.coerce.number().positive()),
    buildingAge: optionalNumber(z.coerce.number().int().min(0)),
    floor: optionalNumber(z.coerce.number().int()),
    totalFloors: optionalNumber(z.coerce.number().int().min(0)),
    heatingType: z.string().optional(),
    monthlyFee: optionalNumber(z.coerce.number().min(0)),
    isFurnished: z.boolean().optional(),
    zoningStatus: z.string().optional(),
    blockNo: z.string().optional(),
    parcelNo: z.string().optional(),
  })
  .refine((data) => Number.isFinite(data.latitude) && Number.isFinite(data.longitude), {
    message: 'errors.locationRequired',
    path: ['latitude'],
  });

export type PropertyFormInput = z.input<typeof propertySchema>;
export type PropertyFormValues = z.output<typeof propertySchema>;

const conditionalFieldsByType: Record<(typeof propertyTypes)[number], string[]> = {
  APARTMENT: [
    'roomCount',
    'grossM2',
    'netM2',
    'buildingAge',
    'floor',
    'totalFloors',
    'heatingType',
    'monthlyFee',
    'isFurnished',
  ],
  VILLA: [
    'roomCount',
    'grossM2',
    'netM2',
    'buildingAge',
    'floor',
    'totalFloors',
    'heatingType',
    'monthlyFee',
    'isFurnished',
  ],
  OFFICE: [
    'roomCount',
    'grossM2',
    'netM2',
    'buildingAge',
    'floor',
    'totalFloors',
    'heatingType',
    'monthlyFee',
    'isFurnished',
  ],
  BUILDING: [
    'roomCount',
    'grossM2',
    'netM2',
    'buildingAge',
    'floor',
    'totalFloors',
    'heatingType',
    'monthlyFee',
    'isFurnished',
  ],
  SHOP: ['grossM2', 'floor', 'monthlyFee'],
  LAND: ['grossM2', 'zoningStatus', 'blockNo', 'parcelNo'],
  OTHER: [],
};

export function fieldsForType(propertyType: (typeof propertyTypes)[number]): string[] {
  return conditionalFieldsByType[propertyType];
}

export function stripIrrelevantFields(
  values: PropertyFormValues,
): PropertyFormValues {
  const allowed = new Set(fieldsForType(values.propertyType));
  const allConditional = [
    'roomCount',
    'grossM2',
    'netM2',
    'buildingAge',
    'floor',
    'totalFloors',
    'heatingType',
    'monthlyFee',
    'isFurnished',
    'zoningStatus',
    'blockNo',
    'parcelNo',
  ];
  const result = { ...values };
  for (const field of allConditional) {
    if (!allowed.has(field)) {
      (result as Record<string, unknown>)[field] = undefined;
    }
  }
  return result;
}
