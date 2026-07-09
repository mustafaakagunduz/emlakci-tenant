import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { formatPrice } from '../format';
import { PropertyThumbnail } from './PropertyThumbnail';
import type { PropertyMarker } from '../types';

interface PropertySummaryCardProps {
  marker: PropertyMarker;
  onClose: () => void;
}

export function PropertySummaryCard({ marker, onClose }: PropertySummaryCardProps) {
  const { t } = useTranslation('properties');
  const navigate = useNavigate();

  const roomAndArea = [marker.roomCount, marker.netM2 ? `${marker.netM2} m²` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <PropertyThumbnail url={marker.coverPhotoUrl} size={48} />
          <h3 className="font-medium text-gray-900">{marker.title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('map.summary.close')}
          className="shrink-0 text-2xl leading-none text-gray-400 hover:text-gray-600 md:text-base"
        >
          ✕
        </button>
      </div>

      <p className="mt-2 text-sm text-gray-500">
        {marker.city} / {marker.district}
      </p>
      <p className="mt-1 text-lg font-semibold text-gray-900">
        {formatPrice(marker.price, marker.currency)}
      </p>
      {roomAndArea && <p className="mt-1 text-sm text-gray-500">{roomAndArea}</p>}

      <p className="mt-2 text-xs text-gray-500">
        {t(`propertyTypes.${marker.propertyType}`)} · {t(`listingTypes.${marker.listingType}`)} ·{' '}
        {t(`statuses.${marker.status}`)}
      </p>

      {(marker.ownerName || marker.ownerPhone) && (
        <p className="mt-2 text-sm text-gray-700">
          {[marker.ownerName, marker.ownerPhone].filter(Boolean).join(' · ')}
        </p>
      )}

      <Button className="mt-3 w-full" onClick={() => navigate(`/properties/${marker.id}`)}>
        {t('map.summary.goToDetail')}
      </Button>
    </div>
  );
}
