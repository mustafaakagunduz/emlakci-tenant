import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { MapView } from '../components/map/MapView';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Tooltip } from '../components/ui/Tooltip';
import { PropertyFilterFields } from '../features/properties/components/PropertyFilterFields';
import { PropertySearchInput } from '../features/properties/components/PropertySearchInput';
import { PropertySummaryCard } from '../features/properties/components/PropertySummaryCard';
import { PropertyThumbnail } from '../features/properties/components/PropertyThumbnail';
import { formatPrice, statusTone } from '../features/properties/format';
import { useDeleteProperty, useProperties, usePropertyMarkers } from '../features/properties/hooks';
import type {
  ListingType,
  Property,
  PropertyFilters,
  PropertyStatus,
  PropertyType,
} from '../features/properties/types';

const LIST_PAGE_SIZE = 20;

function FilterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function parseFilters(params: URLSearchParams): PropertyFilters {
  const num = (key: string) => {
    const value = params.get(key);
    return value ? Number(value) : undefined;
  };
  return {
    q: params.get('q') ?? undefined,
    propertyType: (params.get('propertyType') ?? undefined) as PropertyType | undefined,
    listingType: (params.get('listingType') ?? undefined) as ListingType | undefined,
    status: (params.get('status') ?? undefined) as PropertyStatus | undefined,
    minPrice: num('minPrice'),
    maxPrice: num('maxPrice'),
    page: num('page') ?? 1,
    limit: LIST_PAGE_SIZE,
  };
}

function filtersToParams(filters: PropertyFilters): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'limit') return;
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });
  return params;
}

export function PropertiesPage() {
  const { t } = useTranslation('properties');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const { data, isLoading } = useProperties(filters);
  const { data: markers = [] } = usePropertyMarkers(filters);
  const deleteProperty = useDeleteProperty();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    const clearSelection = () => setSelectedId(null);
    const clearOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelection();
    };
    document.addEventListener('click', clearSelection);
    document.addEventListener('keydown', clearOnEscape);
    return () => {
      document.removeEventListener('click', clearSelection);
      document.removeEventListener('keydown', clearOnEscape);
    };
  }, [selectedId]);

  const selectedMarker = markers.find((m) => m.id === selectedId) ?? null;
  const totalPages = data ? Math.max(1, Math.ceil(data.meta.total / data.meta.limit)) : 1;
  const currentPage = filters.page ?? 1;

  const handleFilterChange = (next: PropertyFilters) => setSearchParams(filtersToParams(next));
  const handleClear = () => setSearchParams(new URLSearchParams());

  const handleSelectFromList = (property: Property) => {
    setSelectedId(property.id);
    setMobileView('map');
  };

  return (
    <AppLayout fullBleed>
      <div className="flex h-full flex-col md:flex-row">
        <div
          className={`relative h-full w-full ${mobileView === 'map' ? 'block' : 'hidden'} md:block md:w-[58%]`}
        >
          <MapView markers={markers} selectedId={selectedId} onSelectMarker={setSelectedId} />
          {selectedMarker && (
            <div
              className="absolute left-4 top-4 z-[1000] hidden w-80 max-w-[calc(100%-2rem)] md:block"
              onClick={(e) => e.stopPropagation()}
            >
              <PropertySummaryCard marker={selectedMarker} onClose={() => setSelectedId(null)} />
            </div>
          )}
        </div>

        <div
          className={`relative h-full min-h-0 w-full flex-col overflow-hidden bg-white ${mobileView === 'list' ? 'flex' : 'hidden'} md:flex md:w-[42%] md:border-l md:border-gray-200`}
        >
          <div className="shrink-0 space-y-3 border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">{t('list.title')}</h1>
              <div className="flex items-center gap-2">
                <Button onClick={() => navigate('/properties/new')}>{t('list.newButton')}</Button>
                <Button
                  variant="secondary"
                  disabled={!selectedId}
                  onClick={() => selectedId && navigate(`/properties/${selectedId}/edit`)}
                >
                  {t('list.edit')}
                </Button>
                <Button
                  variant="danger"
                  disabled={!selectedId}
                  onClick={() => selectedId && setDeleteId(selectedId)}
                >
                  {t('list.delete')}
                </Button>
                <Tooltip label={t('map.filters.openButton')}>
                  <Button
                    className="hidden !px-2.5 md:inline-flex"
                    aria-label={t('map.filters.openButton')}
                    onClick={() => setDesktopFiltersOpen(true)}
                  >
                    <FilterIcon />
                  </Button>
                </Tooltip>
                <Tooltip label={t('map.filters.openButton')}>
                  <Button
                    className="!px-2.5 md:hidden"
                    aria-label={t('map.filters.openButton')}
                    onClick={() => setFiltersOpen(true)}
                  >
                    <FilterIcon />
                  </Button>
                </Tooltip>
              </div>
            </div>
            <PropertySearchInput filters={filters} onChange={handleFilterChange} />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!isLoading && (data?.data.length ?? 0) === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">{t('map.empty')}</p>
            )}
            <div className="space-y-3">
              {data?.data.map((property) => (
                <div
                  key={property.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectFromList(property);
                  }}
                  className={`flex h-24 cursor-pointer overflow-hidden rounded-lg border transition ${
                    selectedId === property.id
                      ? 'border-gray-200 bg-[#f59e0b]'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <PropertyThumbnail
                    url={property.coverPhotoUrl}
                    fill
                    rounded="rounded-none"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{property.title}</p>
                        <p className="text-sm text-gray-500">{property.district}</p>
                      </div>
                      <Badge tone={statusTone[property.status]}>
                        {t(`statuses.${property.status}`)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(property.price, property.currency)}
                      </span>
                      <Badge tone={property.listingType === 'SALE' ? 'blue' : 'gray'}>
                        {t(`listingTypes.${property.listingType}`)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data && data.meta.total > 0 && (
            <div className="flex shrink-0 items-center justify-between border-t border-gray-200 p-3 text-sm text-gray-600">
              <Button
                variant="secondary"
                disabled={currentPage <= 1}
                onClick={() => handleFilterChange({ ...filters, page: currentPage - 1 })}
              >
                ‹
              </Button>
              <span>{t('map.pagination.pageOf', { page: currentPage, total: totalPages })}</span>
              <Button
                variant="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => handleFilterChange({ ...filters, page: currentPage + 1 })}
              >
                ›
              </Button>
            </div>
          )}

          <Drawer
            open={desktopFiltersOpen}
            onClose={() => setDesktopFiltersOpen(false)}
            title={t('map.filters.title')}
          >
            <PropertyFilterFields filters={filters} onChange={handleFilterChange} onClear={handleClear} />
          </Drawer>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[1100] flex h-14 border-t border-gray-200 bg-white md:hidden">
        <button
          type="button"
          onClick={() => setMobileView('map')}
          className={`flex-1 text-sm font-medium ${
            mobileView === 'map' ? 'bg-gray-200 text-brand-navy' : 'text-brand-blue'
          }`}
        >
          {t('map.mobile.mapTab')}
        </button>
        <button
          type="button"
          onClick={() => setMobileView('list')}
          className={`flex-1 text-sm font-medium ${
            mobileView === 'list' ? 'bg-gray-200 text-brand-navy' : 'text-brand-blue'
          }`}
        >
          {t('map.mobile.listTab')}
        </button>
      </div>

      {selectedMarker && mobileView === 'map' && (
        <div
          className="fixed inset-x-0 bottom-14 z-[1100] p-3 md:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <PropertySummaryCard marker={selectedMarker} onClose={() => setSelectedId(null)} />
        </div>
      )}

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title={t('map.filters.title')}>
        <PropertyFilterFields filters={filters} onChange={handleFilterChange} onClear={handleClear} />
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setFiltersOpen(false)}>{t('map.filters.apply')}</Button>
        </div>
      </Drawer>

      <ConfirmDialog
        open={deleteId !== null}
        title={t('list.confirmDeleteTitle')}
        message={t('list.confirmDeleteMessage')}
        confirmLabel={t('list.confirm')}
        cancelLabel={t('list.cancel')}
        variant="danger"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteProperty.mutate(deleteId);
          setDeleteId(null);
        }}
      />
    </AppLayout>
  );
}
