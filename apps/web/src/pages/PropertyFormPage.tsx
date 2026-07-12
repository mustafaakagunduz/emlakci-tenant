import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { PropertyForm } from '../features/properties/components/PropertyForm';
import { PhotoManager } from '../features/properties/components/PhotoManager';
import { useCreateProperty, useProperty, useUpdateProperty } from '../features/properties/hooks';
import type { PropertyFormInput, PropertyFormValues } from '../features/properties/schema';
import { ApiError } from '../api/client';
import type { Property } from '../features/properties/types';

function toFormDefaults(property: Property): Partial<PropertyFormInput> {
  return {
    title: property.title,
    propertyType: property.propertyType,
    listingType: property.listingType,
    status: property.status,
    price: Number(property.price),
    currency: property.currency,
    city: property.city,
    district: property.district,
    neighborhood: property.neighborhood,
    street: property.street ?? undefined,
    addressText: property.addressText,
    latitude: property.latitude,
    longitude: property.longitude,
    description: property.description ?? undefined,
    ownerName: property.ownerName ?? undefined,
    ownerPhone: property.ownerPhone ?? undefined,
    roomCount: property.roomCount ?? undefined,
    grossM2: property.grossM2 ?? undefined,
    netM2: property.netM2 ?? undefined,
    buildingAge: property.buildingAge ?? undefined,
    floor: property.floor ?? undefined,
    totalFloors: property.totalFloors ?? undefined,
    heatingType: property.heatingType ?? undefined,
    monthlyFee: property.monthlyFee ? Number(property.monthlyFee) : undefined,
    isFurnished: property.isFurnished ?? undefined,
    zoningStatus: property.zoningStatus ?? undefined,
    blockNo: property.blockNo ?? undefined,
    parcelNo: property.parcelNo ?? undefined,
  };
}

const NEW_DEFAULTS: Partial<PropertyFormInput> = {
  title: '',
  propertyType: 'APARTMENT',
  listingType: 'SALE',
  status: 'ACTIVE',
  currency: 'TRY',
  city: '',
  district: '',
  neighborhood: '',
  street: '',
  addressText: '',
};

export function PropertyFormPage() {
  const { t } = useTranslation('properties');
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const justCreated = Boolean((location.state as { justCreated?: boolean } | null)?.justCreated);
  const presetLocation = (location.state as { presetLocation?: { lat: number; lng: number } } | null)
    ?.presetLocation;

  const { data: property, isLoading } = useProperty(id ?? '');
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty(id ?? '');

  if (isEdit && (isLoading || !property)) {
    return (
      <AppLayout>
        <p className="text-sm text-gray-500">…</p>
      </AppLayout>
    );
  }

  const mutation = isEdit ? updateProperty : createProperty;
  const errorMessage =
    mutation.isError && mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.isError
        ? t('errors.generic')
        : undefined;

  const handleSubmit = async (values: PropertyFormValues) => {
    if (isEdit) {
      await updateProperty.mutateAsync(values);
      navigate('/');
    } else {
      const created = await createProperty.mutateAsync(values);
      navigate(`/properties/${created.id}/edit`, { state: { justCreated: true } });
    }
  };

  return (
    <AppLayout>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">
        {isEdit ? t('form.editTitle') : t('form.newTitle')}
      </h1>

      {justCreated && (
        <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          {t('photos.createdHint')}
        </div>
      )}

      <PropertyForm
        defaultValues={isEdit && property ? toFormDefaults(property) : NEW_DEFAULTS}
        onSubmit={handleSubmit}
        submitError={errorMessage}
        presetLocation={!isEdit ? presetLocation : undefined}
      />

      {isEdit && property && (
        <div className="mt-10 border-t border-gray-200 pt-8">
          <PhotoManager propertyId={property.id} photos={property.photos ?? []} />
        </div>
      )}
    </AppLayout>
  );
}
