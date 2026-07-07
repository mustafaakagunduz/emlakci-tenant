import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { loginSchema, type LoginFormValues } from '../features/auth/schema';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      const user = await login(values.email, values.password);
      navigate(user.role === 'SUPER_ADMIN' ? '/admin' : '/');
    } catch {
      setFormError(t('errors.invalidCredentials'));
    }
  };

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-gray-900">
      <div className="absolute inset-0">
        <img
          src="/login-bg.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-gray-900/80 via-gray-900/40 to-transparent md:from-gray-900/70 md:via-gray-900/20" />
      </div>

      <div className="relative z-10 flex w-full items-center justify-center bg-white p-6 shadow-2xl sm:w-[440px] sm:flex-none sm:p-10">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-900/5 text-base">
              🏠
            </span>
            EmlakPanel
          </div>

          <h1 className="mb-1 text-2xl font-semibold text-gray-900">{t('title')}</h1>
          <p className="mb-6 text-sm text-gray-500">{t('subtitle')}</p>

          <div className="mb-4">
            <Input
              id="email"
              type="email"
              label={t('email')}
              autoComplete="email"
              error={errors.email ? t(errors.email.message ?? '') : undefined}
              {...register('email')}
            />
          </div>

          <div className="mb-6">
            <Input
              id="password"
              type="password"
              label={t('password')}
              autoComplete="current-password"
              error={errors.password ? t(errors.password.message ?? '') : undefined}
              {...register('password')}
            />
          </div>

          {formError && <p className="mb-4 text-sm text-red-600">{formError}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </form>
      </div>

      <div className="relative z-10 hidden flex-1 flex-col justify-end p-12 text-white md:flex">
        <div className="max-w-md self-end text-right">
          <h2 className="text-3xl font-semibold leading-tight">{t('heroTitle')}</h2>
          <p className="mt-3 text-sm text-white/70">{t('heroSubtitle')}</p>
        </div>
      </div>
    </div>
  );
}
