import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation('common');
  const currentLanguage = i18n.language;

  return (
    <div className={`flex items-center gap-2 text-sm font-medium text-brand-navy ${className}`}>
      <button
        type="button"
        onClick={() => i18n.changeLanguage('tr')}
        aria-pressed={currentLanguage === 'tr'}
        className={currentLanguage === 'tr' ? 'font-semibold' : 'text-brand-navy/50 hover:text-brand-navy'}
      >
        {t('language.tr')}
      </button>
      <span className="text-brand-navy/50">|</span>
      <button
        type="button"
        onClick={() => i18n.changeLanguage('en')}
        aria-pressed={currentLanguage === 'en'}
        className={currentLanguage === 'en' ? 'font-semibold' : 'text-brand-navy/50 hover:text-brand-navy'}
      >
        {t('language.en')}
      </button>
    </div>
  );
}
