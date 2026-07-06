import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../ui/Button';

export function AppLayout({
  children,
  fullBleed = false,
}: {
  children: ReactNode;
  fullBleed?: boolean;
}) {
  const { t } = useTranslation('common');
  const { user, logout } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`;

  return (
    <div
      className={`flex flex-col bg-gray-50 ${fullBleed ? 'h-screen overflow-hidden' : 'min-h-screen'}`}
    >
      <header className="shrink-0 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-8">
            <span className="text-lg font-semibold text-gray-900">{t('appName')}</span>
            <nav className="flex items-center gap-4 sm:gap-6">
              <NavLink to="/" end className={navLinkClass}>
                {t('nav.properties')}
              </NavLink>
              {user?.role === 'ORG_ADMIN' && (
                <NavLink to="/team" className={navLinkClass}>
                  {t('nav.team')}
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden text-sm text-gray-600 sm:inline">{user?.fullName}</span>
            <Button variant="secondary" onClick={logout}>
              {t('logout')}
            </Button>
          </div>
        </div>
      </header>
      <main
        className={
          fullBleed ? 'min-h-0 flex-1 overflow-hidden' : 'mx-auto w-full max-w-6xl px-6 py-8'
        }
      >
        {children}
      </main>
    </div>
  );
}
