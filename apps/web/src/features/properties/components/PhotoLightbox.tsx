import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cloudinaryUrl } from '../../../lib/cloudinary';
import type { PropertyPhoto } from '../types';

interface PhotoLightboxProps {
  photos: PropertyPhoto[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function PhotoLightbox({ photos, index, onClose, onIndexChange }: PhotoLightboxProps) {
  const { t } = useTranslation('properties');
  const photo = photos[index];
  const hasMultiple = photos.length > 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (hasMultiple && e.key === 'ArrowLeft') {
        onIndexChange((index - 1 + photos.length) % photos.length);
      }
      if (hasMultiple && e.key === 'ArrowRight') {
        onIndexChange((index + 1) % photos.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, photos.length, hasMultiple, onClose, onIndexChange]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label={t('photos.ariaClose')}
        className="absolute right-4 top-4 text-2xl text-white/80 hover:text-white"
      >
        ✕
      </button>

      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange((index - 1 + photos.length) % photos.length);
          }}
          aria-label={t('photos.ariaPrevious')}
          className="absolute left-2 text-4xl text-white/80 hover:text-white sm:left-4"
        >
          ‹
        </button>
      )}

      <img
        src={cloudinaryUrl(photo.url, { w: 1400 })}
        onClick={(e) => e.stopPropagation()}
        alt=""
        className="max-h-full max-w-full object-contain"
      />

      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange((index + 1) % photos.length);
          }}
          aria-label={t('photos.ariaNext')}
          className="absolute right-2 text-4xl text-white/80 hover:text-white sm:right-4"
        >
          ›
        </button>
      )}
    </div>
  );
}
