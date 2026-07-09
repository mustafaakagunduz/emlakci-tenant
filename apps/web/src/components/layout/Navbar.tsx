import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium ${isActive ? 'text-brand-navy' : 'text-brand-blue hover:text-brand-navy'}`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-lg font-medium ${isActive ? 'text-brand-navy' : 'text-brand-blue hover:text-brand-navy'}`;

export function Navbar() {
  const { t, i18n } = useTranslation('common');
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="relative z-10 h-16 shrink-0 overflow-visible border-b border-gray-200 bg-white">
      <div className="flex h-full w-full items-center justify-between gap-3 px-6 sm:grid sm:grid-cols-3 sm:px-10">
        <Link to="/" className="relative flex h-full w-fit items-center">
          <img
            src="/pinorex-logo.png"
            alt={t('appName')}
            className="absolute -left-4 top-0 z-20 h-16 w-auto max-w-none sm:-left-8"
          />
        </Link>

        <nav className="hidden items-center justify-center gap-4 sm:flex sm:gap-6">
          <NavLink to="/" end className={navLinkClass}>
            {t('nav.properties')}
          </NavLink>
          {user?.role === 'ORG_ADMIN' && (
            <NavLink to="/team" className={navLinkClass}>
              {t('nav.team')}
            </NavLink>
          )}
        </nav>

        <div className="-mr-6 hidden items-center justify-end gap-2 sm:flex sm:gap-4">
          <span className="hidden text-sm text-brand-navy sm:inline">{user?.fullName}</span>
          <Button
            onClick={() => i18n.changeLanguage(i18n.language === 'tr' ? 'en' : 'tr')}
            className="flex h-9 w-9 items-center justify-center rounded-md p-0 text-xs font-semibold leading-none"
          >
            {i18n.language === 'tr' ? t('language.tr') : t('language.en')}
          </Button>
          <Button variant="danger" onClick={logout}>
            {t('logout')}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={t('nav.openMenu')}
          className="flex h-10 w-10 items-center justify-center text-gray-600 sm:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {createPortal(
        <div className={`fixed inset-0 z-[1200] sm:hidden ${menuOpen ? '' : 'pointer-events-none'}`} aria-hidden={!menuOpen}>
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            onClick={closeMenu}
          />
          <div
            role="dialog"
            aria-modal="true"
            className={`absolute inset-y-0 right-0 flex w-3/4 flex-col bg-white shadow-lg transition-transform duration-300 ease-in-out ${
              menuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-6">
              <span className="truncate text-base font-semibold text-brand-navy">
                {user?.fullName}
              </span>
              <button
                type="button"
                onClick={closeMenu}
                className="text-gray-400 hover:text-gray-600"
                aria-label={t('nav.closeMenu')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-6 px-6 py-8">
              <NavLink to="/" end className={mobileNavLinkClass} onClick={closeMenu}>
                {t('nav.properties')}
              </NavLink>
              {user?.role === 'ORG_ADMIN' && (
                <NavLink to="/team" className={mobileNavLinkClass} onClick={closeMenu}>
                  {t('nav.team')}
                </NavLink>
              )}
            </nav>

            <div className="shrink-0 p-6">
              <LanguageSwitcher className="mb-4 justify-center" />
              <Button variant="danger" onClick={logout} className="w-full bg-red-800 hover:bg-red-900">
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </header>
  );
}
