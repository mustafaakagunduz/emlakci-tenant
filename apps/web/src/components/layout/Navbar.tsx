import { Building2, Languages, LogOut, Menu, Users, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

const sidebarNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-lg font-medium transition-colors ${
    isActive ? 'bg-brand-navy/10 text-brand-navy' : 'text-brand-blue hover:bg-gray-100 hover:text-brand-navy'
  }`;

const railNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex w-full items-center whitespace-nowrap text-base font-medium transition-colors ${
    isActive ? 'bg-brand-navy/10 text-brand-navy' : 'text-brand-blue hover:bg-gray-50 hover:text-brand-navy'
  }`;

const railIconSlotClass = 'flex h-12 w-16 shrink-0 items-center justify-center';

interface NavbarProps {
  railOpen: boolean;
  onRailOpenChange: (open: boolean) => void;
}

export function Navbar({ railOpen, onRailOpenChange }: NavbarProps) {
  const { t, i18n } = useTranslation('common');
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const openRail = () => onRailOpenChange(true);
  const closeRail = () => onRailOpenChange(false);

  return (
    <header className="relative z-10 h-16 shrink-0 overflow-visible border-b border-gray-200 bg-white">
      {/* Logo solda (masaüstünde eski konumu); hamburger yalnızca mobilde sağda */}
      <div className="flex h-full w-full items-center justify-between gap-3 px-6 sm:px-10">
        <Link to="/" className="-ml-3 flex h-full items-center sm:relative sm:ml-0 sm:w-fit">
          <img
            src="/pinorex-logo.png"
            alt={t('appName')}
            className="h-auto w-[56vw] max-w-none sm:absolute sm:-left-8 sm:top-0 sm:z-20 sm:h-16 sm:w-auto"
          />
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={t('nav.openMenu')}
          className="-mr-3 flex h-10 w-10 items-center justify-center text-brand-navy sm:hidden"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        <span className="hidden text-sm font-medium text-brand-navy sm:inline">
          {user?.fullName}
        </span>
      </div>

      {/* Mobil drawer (yalnızca mobilde) */}
      {createPortal(
        <div
          className={`fixed inset-0 z-[1200] sm:hidden ${menuOpen ? '' : 'pointer-events-none'}`}
          aria-hidden={!menuOpen}
        >
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            onClick={closeMenu}
          />
          <div
            role="dialog"
            aria-modal="true"
            className={`absolute inset-y-0 right-0 flex w-3/4 max-w-xs flex-col bg-white shadow-lg transition-transform duration-300 ease-in-out ${
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
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-6 px-6 py-8">
              <NavLink to="/" end className={sidebarNavLinkClass} onClick={closeMenu}>
                <Building2 className="h-5 w-5" aria-hidden="true" />
                {t('nav.properties')}
              </NavLink>
              {user?.role === 'ORG_ADMIN' && (
                <NavLink to="/team" className={sidebarNavLinkClass} onClick={closeMenu}>
                  <Users className="h-5 w-5" aria-hidden="true" />
                  {t('nav.team')}
                </NavLink>
              )}
            </nav>

            <div className="shrink-0 border-t border-gray-200 px-6 py-6">
              <button
                type="button"
                onClick={() => i18n.changeLanguage(i18n.language === 'tr' ? 'en' : 'tr')}
                className="flex w-full items-center gap-3 py-3 text-lg font-medium text-brand-blue hover:text-brand-navy"
              >
                <Languages className="h-5 w-5" aria-hidden="true" />
                {i18n.language === 'tr' ? t('language.tr') : t('language.en')}
              </button>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 py-3 text-lg font-medium text-red-600 hover:text-red-700"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                {t('logout')}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Masaüstü daraltılmış/hover ile genişleyen ikon rayı (yalnızca masaüstünde) */}
      {createPortal(
        <div
          className={`fixed left-0 top-16 z-[1150] hidden flex-col overflow-hidden border-r border-gray-200 bg-white shadow-lg transition-[width] duration-200 ease-in-out sm:flex ${
            railOpen ? 'w-64' : 'w-16'
          }`}
          style={{ height: 'calc(100vh - 4rem)' }}
          onMouseEnter={openRail}
          onMouseLeave={closeRail}
        >
          <nav className="flex flex-1 flex-col py-4">
            <NavLink to="/" end className={railNavLinkClass}>
              <span className={railIconSlotClass}>
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              {t('nav.properties')}
            </NavLink>
            {user?.role === 'ORG_ADMIN' && (
              <NavLink to="/team" className={railNavLinkClass}>
                <span className={railIconSlotClass}>
                  <Users className="h-5 w-5" aria-hidden="true" />
                </span>
                {t('nav.team')}
              </NavLink>
            )}
          </nav>

          <div className="shrink-0 border-t border-gray-200 py-4">
            <button
              type="button"
              onClick={() => i18n.changeLanguage(i18n.language === 'tr' ? 'en' : 'tr')}
              className="flex w-full items-center whitespace-nowrap text-base font-medium text-brand-blue hover:text-brand-navy"
            >
              <span className={railIconSlotClass}>
                <Languages className="h-5 w-5" aria-hidden="true" />
              </span>
              {i18n.language === 'tr' ? t('language.tr') : t('language.en')}
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center whitespace-nowrap text-base font-medium text-red-600 hover:text-red-700"
            >
              <span className={railIconSlotClass}>
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </span>
              {t('logout')}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </header>
  );
}
