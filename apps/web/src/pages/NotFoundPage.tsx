import { MapPinOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  const { t } = useTranslation('common');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50 p-6 text-center">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-blue/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-navy/10 blur-3xl" />

      <MapPinOff
        className="relative h-16 w-16 text-brand-navy"
        strokeWidth={1.5}
        aria-hidden="true"
      />

      <p className="relative mt-6 text-7xl font-bold tracking-tight text-brand-navy">404</p>
      <p className="relative mt-2 text-lg font-medium text-gray-700">{t('notFound.title')}</p>
      <p className="relative mt-2 max-w-sm text-sm text-gray-500">{t('notFound.message')}</p>

      <Link
        to="/"
        className="relative mt-8 rounded-md bg-brand-navy px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-blue"
      >
        {t('notFound.backButton')}
      </Link>
    </div>
  );
}
