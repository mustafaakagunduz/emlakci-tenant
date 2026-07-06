import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { listingTypes, propertyStatuses, propertyTypes } from '../schema';
import type { PropertyFilters } from '../types';

interface PropertyFilterBarProps {
  filters: PropertyFilters;
  onChange: (next: PropertyFilters) => void;
  onClear: () => void;
}

const DEBOUNCE_MS = 400;

export function PropertyFilterBar({ filters, onChange, onClear }: PropertyFilterBarProps) {
  const { t } = useTranslation('properties');
  const [q, setQ] = useState(filters.q ?? '');
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? '');

  useEffect(() => setQ(filters.q ?? ''), [filters.q]);
  useEffect(() => setMinPrice(filters.minPrice?.toString() ?? ''), [filters.minPrice]);
  useEffect(() => setMaxPrice(filters.maxPrice?.toString() ?? ''), [filters.maxPrice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = q || undefined;
      if (next !== (filters.q ?? undefined)) {
        onChange({ ...filters, q: next, page: 1 });
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const min = minPrice ? Number(minPrice) : undefined;
      const max = maxPrice ? Number(maxPrice) : undefined;
      if (min !== filters.minPrice || max !== filters.maxPrice) {
        onChange({ ...filters, minPrice: min, maxPrice: max, page: 1 });
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, maxPrice]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="col-span-2 sm:col-span-3">
        <Input
          placeholder={t('map.filters.search')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <Select
        value={filters.propertyType ?? ''}
        onChange={(e) =>
          onChange({
            ...filters,
            propertyType: (e.target.value || undefined) as PropertyFilters['propertyType'],
            page: 1,
          })
        }
      >
        <option value="">{t('map.filters.allTypes')}</option>
        {propertyTypes.map((pt) => (
          <option key={pt} value={pt}>
            {t(`propertyTypes.${pt}`)}
          </option>
        ))}
      </Select>
      <Select
        value={filters.listingType ?? ''}
        onChange={(e) =>
          onChange({
            ...filters,
            listingType: (e.target.value || undefined) as PropertyFilters['listingType'],
            page: 1,
          })
        }
      >
        <option value="">{t('map.filters.allListingTypes')}</option>
        {listingTypes.map((lt) => (
          <option key={lt} value={lt}>
            {t(`listingTypes.${lt}`)}
          </option>
        ))}
      </Select>
      <Select
        value={filters.status ?? ''}
        onChange={(e) =>
          onChange({
            ...filters,
            status: (e.target.value || undefined) as PropertyFilters['status'],
            page: 1,
          })
        }
      >
        <option value="">{t('map.filters.allStatuses')}</option>
        {propertyStatuses.map((s) => (
          <option key={s} value={s}>
            {t(`statuses.${s}`)}
          </option>
        ))}
      </Select>
      <Input
        type="number"
        placeholder={t('map.filters.minPrice')}
        value={minPrice}
        onChange={(e) => setMinPrice(e.target.value)}
      />
      <Input
        type="number"
        placeholder={t('map.filters.maxPrice')}
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
      />
      <Button variant="secondary" onClick={onClear}>
        {t('map.filters.clear')}
      </Button>
    </div>
  );
}
