import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { StaticLocationMap } from '../components/map/StaticLocationMap';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PhotoLightbox } from '../features/properties/components/PhotoLightbox';
import { cloudinaryUrl } from '../lib/cloudinary';
import { formatPrice, statusTone } from '../features/properties/format';
import { useDeleteProperty, useProperty } from '../features/properties/hooks';

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('properties');
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(id ?? '');
  const deleteProperty = useDeleteProperty();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (isLoading || !property) {
    return (
      <AppLayout>
        <p className="text-sm text-gray-500">{t('detail.loading')}</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone={statusTone[property.status]}>{t(`statuses.${property.status}`)}</Badge>
            <Badge tone="gray">{t(`propertyTypes.${property.propertyType}`)}</Badge>
            <Badge tone={property.listingType === 'SALE' ? 'blue' : 'gray'}>
              {t(`listingTypes.${property.listingType}`)}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">{property.title}</h1>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {formatPrice(property.price, property.currency)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={() => navigate(`/properties/${property.id}/edit`)}>
            {t('list.edit')}
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            {t('list.delete')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-lg font-medium text-gray-900">{t('detail.sections.basic')}</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <DetailField label={t('form.fields.city')} value={property.city} />
              <DetailField label={t('form.fields.district')} value={property.district} />
              <DetailField label={t('form.fields.neighborhood')} value={property.neighborhood} />
              {property.street && (
                <DetailField label={t('form.fields.street')} value={property.street} />
              )}
              {property.roomCount && (
                <DetailField label={t('form.fields.roomCount')} value={property.roomCount} />
              )}
              {property.grossM2 != null && (
                <DetailField label={t('form.fields.grossM2')} value={`${property.grossM2} m²`} />
              )}
              {property.netM2 != null && (
                <DetailField label={t('form.fields.netM2')} value={`${property.netM2} m²`} />
              )}
              {property.buildingAge != null && (
                <DetailField label={t('form.fields.buildingAge')} value={String(property.buildingAge)} />
              )}
              {property.floor != null && (
                <DetailField label={t('form.fields.floor')} value={String(property.floor)} />
              )}
              {property.totalFloors != null && (
                <DetailField label={t('form.fields.totalFloors')} value={String(property.totalFloors)} />
              )}
              {property.heatingType && (
                <DetailField label={t('form.fields.heatingType')} value={property.heatingType} />
              )}
              {property.monthlyFee != null && (
                <DetailField
                  label={t('form.fields.monthlyFee')}
                  value={formatPrice(property.monthlyFee, property.currency)}
                />
              )}
              {property.isFurnished != null && (
                <DetailField
                  label={t('form.fields.isFurnished')}
                  value={property.isFurnished ? t('detail.yes') : t('detail.no')}
                />
              )}
              {property.zoningStatus && (
                <DetailField label={t('form.fields.zoningStatus')} value={property.zoningStatus} />
              )}
              {property.blockNo && (
                <DetailField label={t('form.fields.blockNo')} value={property.blockNo} />
              )}
              {property.parcelNo && (
                <DetailField label={t('form.fields.parcelNo')} value={property.parcelNo} />
              )}
            </dl>
          </section>

          {property.description && (
            <section>
              <h2 className="mb-3 text-lg font-medium text-gray-900">
                {t('form.sections.description')}
              </h2>
              <p className="whitespace-pre-line text-sm text-gray-700">{property.description}</p>
            </section>
          )}

          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h2 className="mb-1 text-sm font-semibold text-amber-900">
              {t('detail.ownerBlockTitle')}
            </h2>
            <p className="mb-3 text-xs text-amber-700">{t('form.fields.ownerHint')}</p>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <DetailField label={t('form.fields.ownerName')} value={property.ownerName ?? '—'} />
              <DetailField label={t('form.fields.ownerPhone')} value={property.ownerPhone ?? '—'} />
            </dl>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium text-gray-900">{t('photos.title')}</h2>
            {property.photos && property.photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {property.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className="aspect-square overflow-hidden rounded-md border border-gray-200"
                  >
                    <img
                      src={cloudinaryUrl(photo.url, { w: 300, h: 300 })}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('photos.empty')}</p>
            )}
          </section>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-medium text-gray-900">{t('form.sections.location')}</h2>
          <StaticLocationMap latitude={property.latitude} longitude={property.longitude} />
          <p className="text-sm text-gray-700">{property.addressText}</p>
        </div>
      </div>

      {lightboxIndex !== null && property.photos && (
        <PhotoLightbox
          photos={property.photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={t('list.confirmDeleteTitle')}
        message={t('list.confirmDeleteMessage')}
        confirmLabel={t('list.confirm')}
        cancelLabel={t('list.cancel')}
        variant="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          deleteProperty.mutate(property.id, { onSuccess: () => navigate('/') });
        }}
      />
    </AppLayout>
  );
}
