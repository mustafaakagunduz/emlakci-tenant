import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useCreateOrganization } from '../hooks';
import { createOrganizationSchema, type CreateOrganizationFormValues } from '../schema';

export function CreateOrganizationModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation('admin');
  const createOrganization = useCreateOrganization();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema),
  });

  const close = () => {
    reset();
    createOrganization.reset();
    onClose();
  };

  const onSubmit = async (values: CreateOrganizationFormValues) => {
    await createOrganization.mutateAsync(values);
    close();
  };

  return (
    <Modal open={open} onClose={close} title={t('createOrganization.title')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="org-name"
          label={t('createOrganization.nameLabel')}
          error={errors.name && t(errors.name.message ?? '')}
          {...register('name')}
        />
        {createOrganization.isError && (
          <p className="text-sm text-red-600">{t('errors.generic')}</p>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={close}>
            {t('organizationDetail.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('createOrganization.submitting') : t('createOrganization.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
