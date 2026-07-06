import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { ApiError } from '../../../api/client';
import { useCreateOrgUser } from '../hooks';
import { createOrgUserSchema, type CreateOrgUserFormValues } from '../schema';

export function CreateOrgUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('team');
  const createOrgUser = useCreateOrgUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrgUserFormValues>({
    resolver: zodResolver(createOrgUserSchema),
    defaultValues: { role: 'AGENT' },
  });

  const close = () => {
    reset();
    createOrgUser.reset();
    onClose();
  };

  const onSubmit = async (values: CreateOrgUserFormValues) => {
    await createOrgUser.mutateAsync(values);
    close();
  };

  const isConflict = createOrgUser.error instanceof ApiError && createOrgUser.error.status === 409;

  return (
    <Modal open={open} onClose={close} title={t('createUser.title')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="team-user-fullName"
          label={t('createUser.fullNameLabel')}
          error={errors.fullName && t(errors.fullName.message ?? '')}
          {...register('fullName')}
        />
        <Input
          id="team-user-email"
          type="email"
          label={t('createUser.emailLabel')}
          error={errors.email && t(errors.email.message ?? '')}
          {...register('email')}
        />
        <Input
          id="team-user-password"
          type="password"
          label={t('createUser.passwordLabel')}
          error={errors.password && t(errors.password.message ?? '')}
          {...register('password')}
        />
        <Select id="team-user-role" label={t('createUser.roleLabel')} {...register('role')}>
          <option value="AGENT">{t('roles.AGENT')}</option>
          <option value="ORG_ADMIN">{t('roles.ORG_ADMIN')}</option>
        </Select>

        {createOrgUser.isError && (
          <p className="text-sm text-red-600">
            {isConflict ? t('errors.emailConflict') : t('errors.generic')}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={close}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('createUser.submitting') : t('createUser.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
