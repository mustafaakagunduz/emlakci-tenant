import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatPrice, statusTone } from '../format';
import { PropertyThumbnail } from './PropertyThumbnail';
import type { PropertyMarker } from '../types';

interface PropertySummaryCardProps {
  marker: PropertyMarker;
  onClose: () => void;
}

export function PropertySummaryCard({ marker, onClose }: PropertySummaryCardProps) {
  const { t } = useTranslation('properties');
  const navigate = useNavigate();

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
          className="shrink-0 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      <p className="mt-1 text-lg font-semibold text-gray-900">
        {formatPrice(marker.price, marker.currency)}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge tone="gray">{t(`propertyTypes.${marker.propertyType}`)}</Badge>
        <Badge tone={marker.listingType === 'SALE' ? 'blue' : 'gray'}>
          {t(`listingTypes.${marker.listingType}`)}
        </Badge>
        <Badge tone={statusTone[marker.status]}>{t(`statuses.${marker.status}`)}</Badge>
      </div>
      <p className="mt-2 text-sm text-gray-500">{marker.district}</p>
      <Button className="mt-3 w-full" onClick={() => navigate(`/properties/${marker.id}`)}>
        {t('map.summary.goToDetail')}
      </Button>
    </div>
  );
}
