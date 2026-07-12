import { useRef, useState, type UIEvent } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { StaticLocationMap } from '../components/map/StaticLocationMap';
import { DetailField } from '../features/properties/components/DetailField';
import { PhotoLightbox } from '../features/properties/components/PhotoLightbox';
import { cloudinaryUrl } from '../lib/cloudinary';
import { formatPrice } from '../features/properties/format';
import { usePublicProperty } from '../features/properties/hooks';
import { NotFoundPage } from './NotFoundPage';

export function PublicPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('properties');
  const { data: property, isLoading, isError } = usePublicProperty(id ?? '');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = (el: HTMLDivElement) => {
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const handleThumbStripRef = (el: HTMLDivElement | null) => {
    thumbStripRef.current = el;
    if (el) updateScrollState(el);
  };

  const handleThumbStripScroll = (e: UIEvent<HTMLDivElement>) => {
    updateScrollState(e.currentTarget);
  };

  const scrollThumbs = (direction: 'left' | 'right') => {
    thumbStripRef.current?.scrollBy({ left: direction === 'left' ? -240 : 240, behavior: 'smooth' });
  };

  if (isError) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-center border-b border-gray-200 bg-white px-6 py-3">
        <img src="/pinorex-logo.png" alt={t('common:appName')} className="h-10 w-auto" />
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        {isLoading || !property ? (
          <p className="text-sm text-gray-500">{t('detail.loading')}</p>
        ) : (
          <>
            {property.photos.length > 0 ? (
              <div className="mb-6">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoIndex((prev) => (prev + 1) % property.photos.length)
                    }
                    className="block h-full w-full"
                  >
                    <img
                      src={cloudinaryUrl(property.photos[activePhotoIndex].url, { w: 1200 })}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(activePhotoIndex)}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-gray-900/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-gray-900/70"
                  >
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('photos.fullscreenButton')}
                  </button>
                </div>
                {property.photos.length > 1 && (
                  <div className="relative mt-2">
                    {canScrollLeft && (
                      <button
                        type="button"
                        onClick={() => scrollThumbs('left')}
                        aria-label={t('photos.ariaPrevious')}
                        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1 text-gray-700 shadow hover:bg-white"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                    <div
                      ref={handleThumbStripRef}
                      onScroll={handleThumbStripScroll}
                      className={`flex gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                        canScrollLeft ? 'pl-8' : ''
                      } ${canScrollRight ? 'pr-8' : ''}`}
                    >
                      {property.photos.map((photo, index) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setActivePhotoIndex(index)}
                          className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border ${
                            index === activePhotoIndex
                              ? 'border-2 border-brand-blue'
                              : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={cloudinaryUrl(photo.url, { w: 120, h: 120 })}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                    {canScrollRight && (
                      <button
                        type="button"
                        onClick={() => scrollThumbs('right')}
                        aria-label={t('photos.ariaNext')}
                        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1 text-gray-700 shadow hover:bg-white"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 flex aspect-video w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-100">
                <p className="text-sm text-gray-500">{t('photos.empty')}</p>
              </div>
            )}

            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">{property.title}</h1>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                {formatPrice(property.price, property.currency)}
              </p>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="mb-3 text-lg font-medium text-gray-900">
                  {t('detail.sections.basic')}
                </h2>
                <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  <DetailField label={t('form.fields.city')} value={property.city} />
                  <DetailField label={t('form.fields.district')} value={property.district} />
                  <DetailField
                    label={t('form.fields.neighborhood')}
                    value={property.neighborhood}
                  />
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
                    <DetailField
                      label={t('form.fields.buildingAge')}
                      value={String(property.buildingAge)}
                    />
                  )}
                  {property.floor != null && (
                    <DetailField label={t('form.fields.floor')} value={String(property.floor)} />
                  )}
                  {property.totalFloors != null && (
                    <DetailField
                      label={t('form.fields.totalFloors')}
                      value={String(property.totalFloors)}
                    />
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
                    <DetailField
                      label={t('form.fields.zoningStatus')}
                      value={property.zoningStatus}
                    />
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
                  <p className="whitespace-pre-line text-sm text-gray-700">
                    {property.description}
                  </p>
                </section>
              )}
            </div>

            <div className="mt-8 space-y-3">
              <h2 className="text-lg font-medium text-gray-900">{t('form.sections.location')}</h2>
              <StaticLocationMap
                latitude={property.latitude}
                longitude={property.longitude}
                interactive
                className="h-80 w-full sm:h-96"
              />
              <p className="text-sm text-gray-700">{property.addressText}</p>
            </div>

            {lightboxIndex !== null && (
              <PhotoLightbox
                photos={property.photos}
                index={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onIndexChange={(index) => {
                  setLightboxIndex(index);
                  setActivePhotoIndex(index);
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
