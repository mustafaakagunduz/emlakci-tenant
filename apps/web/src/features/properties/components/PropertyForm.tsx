import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Combobox } from '../../../components/ui/Combobox';
import { LocationPicker } from '../../../components/map/LocationPicker';
import { useDebouncedValue } from '../../../lib/useDebouncedValue';
import { useDistricts, useNeighborhoods, useProvinces, useStreets } from '../../geo/hooks';
import { fetchForwardGeocode, fetchReverseGeocode } from '../../geo/api';
import {
  fieldsForType,
  listingTypes,
  propertySchema,
  propertyStatuses,
  propertyTypes,
  stripIrrelevantFields,
  type PropertyFormInput,
  type PropertyFormValues,
} from '../schema';

interface PropertyFormProps {
  defaultValues: Partial<PropertyFormInput>;
  onSubmit: (values: PropertyFormValues) => Promise<void>;
  submitError?: string;
  presetLocation?: { lat: number; lng: number };
}

export function PropertyForm({ defaultValues, onSubmit, submitError, presetLocation }: PropertyFormProps) {
  const { t } = useTranslation('properties');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormInput, unknown, PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues,
  });

  const propertyType = watch('propertyType');
  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const activeFields = new Set(fieldsForType(propertyType));

  const submit = async (values: PropertyFormValues) => {
    await onSubmit(stripIrrelevantFields(values));
  };

  // Konum bölümü: il/ilçe/mahalle Combobox'ları + iki yönlü harita senkronu.
  const cityValue = watch('city') ?? '';
  const districtValue = watch('district') ?? '';
  const neighborhoodValue = watch('neighborhood') ?? '';
  const streetValue = watch('street') ?? '';
  const debouncedCityQuery = useDebouncedValue(cityValue, 250);
  const debouncedDistrictQuery = useDebouncedValue(districtValue, 250);
  const debouncedNeighborhoodQuery = useDebouncedValue(neighborhoodValue, 250);
  const debouncedStreetQuery = useDebouncedValue(streetValue, 250);

  const { data: provinceOptions = [], isFetching: provincesLoading } =
    useProvinces(debouncedCityQuery);
  const { data: districtOptions = [], isFetching: districtsLoading } = useDistricts(
    cityValue,
    debouncedDistrictQuery,
  );
  const { data: neighborhoodOptions = [], isFetching: neighborhoodsLoading } = useNeighborhoods(
    cityValue,
    districtValue,
    debouncedNeighborhoodQuery,
  );
  const { data: streetOptions = [], isFetching: streetsLoading } = useStreets(
    cityValue,
    districtValue,
    neighborhoodValue,
    debouncedStreetQuery,
  );

  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(
    null,
  );
  const [isLocating, setIsLocating] = useState(false);
  const reverseTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (reverseTimeoutRef.current) clearTimeout(reverseTimeoutRef.current);
    };
  }, []);

  function handleSelectProvince(name: string) {
    setValue('city', name, { shouldValidate: true });
    setValue('district', '', { shouldValidate: true });
    setValue('neighborhood', '', { shouldValidate: true });
    setValue('street', '', { shouldValidate: true });
    const province = provinceOptions.find((p) => p.name === name);
    if (province) {
      setFlyTarget({ lat: province.lat, lng: province.lng, zoom: 10 });
    }
  }

  function handleSelectDistrict(name: string) {
    setValue('district', name, { shouldValidate: true });
    setValue('neighborhood', '', { shouldValidate: true });
    setValue('street', '', { shouldValidate: true });
    const district = districtOptions.find((d) => d.name === name);
    if (district && district.lat != null && district.lng != null) {
      setFlyTarget({ lat: district.lat, lng: district.lng, zoom: 13 });
    }
  }

  async function handleSelectNeighborhood(name: string) {
    setValue('neighborhood', name, { shouldValidate: true });
    setValue('street', '', { shouldValidate: true });
    if (!cityValue || !districtValue) return;
    setIsLocating(true);
    try {
      const coords = await fetchForwardGeocode({
        province: cityValue,
        district: districtValue,
        neighborhood: name,
      });
      if (coords) {
        setFlyTarget({ lat: coords.lat, lng: coords.lng, zoom: 16 });
      }
    } finally {
      setIsLocating(false);
    }
  }

  async function handleSelectStreet(name: string) {
    setValue('street', name, { shouldValidate: true });
    if (!cityValue || !districtValue) return;
    setIsLocating(true);
    try {
      const coords = await fetchForwardGeocode({
        province: cityValue,
        district: districtValue,
        neighborhood: neighborhoodValue || undefined,
        street: name,
      });
      if (coords) {
        setFlyTarget({ lat: coords.lat, lng: coords.lng, zoom: 17 });
      }
    } finally {
      setIsLocating(false);
    }
  }

  // Harita → alanlar: tıklama/sürükleme pini hemen taşır, reverse-geocode 300ms
  // debounce'lu tetiklenir (spec'teki döngü koruması: bu yalnızca kullanıcının
  // haritayla etkileşiminde çalışır, alan seçimlerinin tetiklediği flyTo bunu
  // TETİKLEMEZ — iki yön birbirinden bağımsız, imperative çağrılardır).
  function handleMapChange(lat: number, lng: number) {
    setValue('latitude', lat, { shouldValidate: true });
    setValue('longitude', lng, { shouldValidate: true });

    if (reverseTimeoutRef.current) clearTimeout(reverseTimeoutRef.current);
    reverseTimeoutRef.current = setTimeout(async () => {
      setIsLocating(true);
      try {
        const result = await fetchReverseGeocode(lat, lng);
        setValue('city', result.province ?? '', { shouldValidate: true });
        setValue('district', result.district ?? '', { shouldValidate: true });
        setValue('neighborhood', result.neighborhood ?? '', { shouldValidate: true });
        setValue('street', result.street ?? '', { shouldValidate: true });
      } finally {
        setIsLocating(false);
      }
    }, 300);
  }

  // Ana sayfadaki haritada çift tıklanan noktadan gelinmişse, harita ve
  // adres alanlarını o noktaya göre önceden doldur (bkz. PropertiesPage'deki
  // "yeni kayıt oluştur" onay akışı).
  useEffect(() => {
    if (presetLocation) {
      handleMapChange(presetLocation.lat, presetLocation.lng);
      setFlyTarget({ lat: presetLocation.lat, lng: presetLocation.lng, zoom: 16 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-8">
      <section>
        <h2 className="mb-4 text-lg font-medium text-gray-900">{t('form.sections.basic')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="title"
            label={t('form.fields.title')}
            error={errors.title && t(errors.title.message ?? '')}
            {...register('title')}
          />
          <Select id="propertyType" label={t('form.fields.propertyType')} {...register('propertyType')}>
            {propertyTypes.map((pt) => (
              <option key={pt} value={pt}>
                {t(`propertyTypes.${pt}`)}
              </option>
            ))}
          </Select>
          <Select id="listingType" label={t('form.fields.listingType')} {...register('listingType')}>
            {listingTypes.map((lt) => (
              <option key={lt} value={lt}>
                {t(`listingTypes.${lt}`)}
              </option>
            ))}
          </Select>
          <Select id="status" label={t('form.fields.status')} {...register('status')}>
            {propertyStatuses.map((s) => (
              <option key={s} value={s}>
                {t(`statuses.${s}`)}
              </option>
            ))}
          </Select>
          <Input
            id="price"
            type="number"
            step="0.01"
            label={t('form.fields.price')}
            error={errors.price && t(errors.price.message ?? '')}
            {...register('price')}
          />
          <Select id="currency" label={t('form.fields.currency')} {...register('currency')}>
            <option value="TRY">TRY</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </Select>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium text-gray-900">{t('form.sections.location')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Combobox
            id="city"
            label={t('form.fields.city')}
            placeholder={t('form.location.cityPlaceholder')}
            value={cityValue}
            onChange={(value) => setValue('city', value, { shouldValidate: true })}
            onSelectOption={handleSelectProvince}
            options={provinceOptions.map((p) => p.name)}
            loading={provincesLoading}
            emptyMessage={t('form.location.emptyOptions')}
            error={errors.city && t(errors.city.message ?? '')}
          />
          <Combobox
            id="district"
            label={t('form.fields.district')}
            placeholder={
              cityValue
                ? t('form.location.districtPlaceholderReady')
                : t('form.location.districtPlaceholder')
            }
            value={districtValue}
            onChange={(value) => setValue('district', value, { shouldValidate: true })}
            onSelectOption={handleSelectDistrict}
            options={districtOptions.map((d) => d.name)}
            loading={districtsLoading}
            disabled={!cityValue}
            emptyMessage={t('form.location.emptyOptions')}
            error={errors.district && t(errors.district.message ?? '')}
          />
          <Combobox
            id="neighborhood"
            label={t('form.fields.neighborhood')}
            placeholder={
              districtValue
                ? t('form.location.neighborhoodPlaceholderReady')
                : t('form.location.neighborhoodPlaceholder')
            }
            value={neighborhoodValue}
            onChange={(value) => setValue('neighborhood', value, { shouldValidate: true })}
            onSelectOption={handleSelectNeighborhood}
            options={neighborhoodOptions}
            loading={neighborhoodsLoading}
            disabled={!districtValue}
            emptyMessage={t('form.location.emptyOptions')}
            error={errors.neighborhood && t(errors.neighborhood.message ?? '')}
          />
          <Combobox
            id="street"
            label={t('form.fields.street')}
            placeholder={
              neighborhoodValue
                ? t('form.location.streetPlaceholderReady')
                : t('form.location.streetPlaceholder')
            }
            value={streetValue}
            onChange={(value) => setValue('street', value, { shouldValidate: true })}
            onSelectOption={handleSelectStreet}
            options={streetOptions}
            loading={streetsLoading}
            disabled={!neighborhoodValue}
            emptyMessage={t('form.location.emptyOptions')}
          />
          <Input
            id="addressText"
            label={t('form.fields.addressText')}
            error={errors.addressText && t(errors.addressText.message ?? '')}
            {...register('addressText')}
          />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm text-gray-500">{t('form.location.mapHint')}</p>
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onChange={handleMapChange}
            flyTo={flyTarget}
            isLocating={isLocating}
            locatingLabel={t('form.location.locating')}
          />
          {errors.latitude && (
            <p className="mt-1 text-sm text-red-600">{t(errors.latitude.message ?? '')}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium text-gray-900">{t('form.sections.details')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {activeFields.has('roomCount') && (
            <Input id="roomCount" label={t('form.fields.roomCount')} {...register('roomCount')} />
          )}
          {activeFields.has('grossM2') && (
            <Input
              id="grossM2"
              type="number"
              step="0.01"
              label={t('form.fields.grossM2')}
              {...register('grossM2')}
            />
          )}
          {activeFields.has('netM2') && (
            <Input
              id="netM2"
              type="number"
              step="0.01"
              label={t('form.fields.netM2')}
              {...register('netM2')}
            />
          )}
          {activeFields.has('buildingAge') && (
            <Input
              id="buildingAge"
              type="number"
              label={t('form.fields.buildingAge')}
              {...register('buildingAge')}
            />
          )}
          {activeFields.has('floor') && (
            <Input id="floor" type="number" label={t('form.fields.floor')} {...register('floor')} />
          )}
          {activeFields.has('totalFloors') && (
            <Input
              id="totalFloors"
              type="number"
              label={t('form.fields.totalFloors')}
              {...register('totalFloors')}
            />
          )}
          {activeFields.has('heatingType') && (
            <Input
              id="heatingType"
              label={t('form.fields.heatingType')}
              {...register('heatingType')}
            />
          )}
          {activeFields.has('monthlyFee') && (
            <Input
              id="monthlyFee"
              type="number"
              step="0.01"
              label={t('form.fields.monthlyFee')}
              {...register('monthlyFee')}
            />
          )}
          {activeFields.has('zoningStatus') && (
            <Input
              id="zoningStatus"
              label={t('form.fields.zoningStatus')}
              {...register('zoningStatus')}
            />
          )}
          {activeFields.has('blockNo') && (
            <Input id="blockNo" label={t('form.fields.blockNo')} {...register('blockNo')} />
          )}
          {activeFields.has('parcelNo') && (
            <Input id="parcelNo" label={t('form.fields.parcelNo')} {...register('parcelNo')} />
          )}
          {activeFields.has('isFurnished') && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" {...register('isFurnished')} />
              {t('form.fields.isFurnished')}
            </label>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium text-gray-900">{t('form.sections.owner')}</h2>
        <p className="mb-4 text-sm text-gray-500">{t('form.fields.ownerHint')}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input id="ownerName" label={t('form.fields.ownerName')} {...register('ownerName')} />
          <Input id="ownerPhone" label={t('form.fields.ownerPhone')} {...register('ownerPhone')} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium text-gray-900">{t('form.sections.description')}</h2>
        <textarea
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          rows={4}
          {...register('description')}
        />
      </section>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate('/')}>
          {t('form.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('form.submitting') : t('form.submit')}
        </Button>
      </div>
    </form>
  );
}
