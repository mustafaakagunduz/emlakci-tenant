import { Share2, SquarePen, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Tooltip } from '../../../components/ui/Tooltip';
import { formatPrice } from '../format';
import type { PropertyMarker } from '../types';

interface PropertySummaryCardProps {
  marker: PropertyMarker;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

export function PropertySummaryCard({
  marker,
  onClose,
  onEdit,
  onDelete,
  onShare,
}: PropertySummaryCardProps) {
  const { t } = useTranslation('properties');
  const navigate = useNavigate();

  const roomAndArea = [marker.roomCount, marker.netM2 ? `${marker.netM2} m²` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-gray-900">{marker.title}</h3>
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

      <div className="mt-3 flex gap-2">
        {onEdit && (
          <Tooltip label={t('list.edit')}>
            <Button className="!px-2.5" aria-label={t('list.edit')} onClick={onEdit}>
              <SquarePen className="h-4 w-4 text-white" aria-hidden="true" />
            </Button>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip label={t('list.delete')}>
            <Button className="!px-2.5" aria-label={t('list.delete')} onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-white" aria-hidden="true" />
            </Button>
          </Tooltip>
        )}
        {onShare && (
          <Tooltip label={t('list.share')}>
            <Button className="!px-2.5" aria-label={t('list.share')} onClick={onShare}>
              <Share2 className="h-4 w-4 text-white" aria-hidden="true" />
            </Button>
          </Tooltip>
        )}
        <Button className="flex-1" onClick={() => navigate(`/properties/${marker.id}`)}>
          {t('map.summary.goToDetail')}
        </Button>
      </div>
    </div>
  );
}
