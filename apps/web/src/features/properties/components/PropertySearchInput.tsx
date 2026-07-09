import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../../../components/ui/Input';
import type { PropertyFilters } from '../types';

interface PropertySearchInputProps {
  filters: PropertyFilters;
  onChange: (next: PropertyFilters) => void;
}

const DEBOUNCE_MS = 400;

export function PropertySearchInput({ filters, onChange }: PropertySearchInputProps) {
  const { t } = useTranslation('properties');
  const [q, setQ] = useState(filters.q ?? '');

  useEffect(() => setQ(filters.q ?? ''), [filters.q]);

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

  return (
    <Input placeholder={t('map.filters.search')} value={q} onChange={(e) => setQ(e.target.value)} />
  );
}
