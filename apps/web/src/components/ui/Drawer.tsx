import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Full-viewport slide-over panel, portalled to document.body so it always
 * covers the whole screen regardless of ancestor stacking contexts (e.g. the
 * mobile map/list tab bar's z-index).
 */
export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const { t } = useTranslation('common');
  return createPortal(
    <div
      className={`fixed inset-0 z-[1200] ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute inset-y-0 right-0 flex w-3/4 flex-col bg-white p-6 shadow-lg transition-transform duration-300 ease-in-out sm:w-full sm:max-w-sm ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-400 hover:text-gray-600 sm:text-base"
            aria-label={t('close')}
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
