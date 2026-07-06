import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { LocationPicker } from '../../../components/map/LocationPicker';
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
}

export function PropertyForm({ defaultValues, onSubmit, submitError }: PropertyFormProps) {
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
          <Input
            id="city"
            label={t('form.fields.city')}
            error={errors.city && t(errors.city.message ?? '')}
            {...register('city')}
          />
          <Input
            id="district"
            label={t('form.fields.district')}
            error={errors.district && t(errors.district.message ?? '')}
            {...register('district')}
          />
          <Input
            id="neighborhood"
            label={t('form.fields.neighborhood')}
            error={errors.neighborhood && t(errors.neighborhood.message ?? '')}
            {...register('neighborhood')}
          />
          <Input
            id="addressText"
            label={t('form.fields.addressText')}
            error={errors.addressText && t(errors.addressText.message ?? '')}
            {...register('addressText')}
          />
        </div>
        <div className="mt-4">
          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lng) => {
              setValue('latitude', lat, { shouldValidate: true });
              setValue('longitude', lng, { shouldValidate: true });
            }}
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
