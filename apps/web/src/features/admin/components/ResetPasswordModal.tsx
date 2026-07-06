import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useUpdateUser } from '../hooks';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schema';

export function ResetPasswordModal({
  open,
  onClose,
  organizationId,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  userId: string | null;
}) {
  const { t } = useTranslation('admin');
  const updateUser = useUpdateUser(organizationId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const close = () => {
    reset();
    updateUser.reset();
    onClose();
  };

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!userId) return;
    await updateUser.mutateAsync({ id: userId, input: values });
    close();
  };

  return (
    <Modal open={open} onClose={close} title={t('resetPassword.title')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="reset-password"
          type="password"
          label={t('resetPassword.passwordLabel')}
          error={errors.password && t(errors.password.message ?? '')}
          {...register('password')}
        />
        {updateUser.isError && <p className="text-sm text-red-600">{t('errors.generic')}</p>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={close}>
            {t('organizationDetail.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('resetPassword.submitting') : t('resetPassword.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
