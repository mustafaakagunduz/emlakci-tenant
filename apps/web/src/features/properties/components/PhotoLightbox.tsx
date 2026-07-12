import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cloudinaryUrl } from '../../../lib/cloudinary';

interface PhotoLightboxProps {
  photos: { url: string }[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function PhotoLightbox({ photos, index, onClose, onIndexChange }: PhotoLightboxProps) {
  const { t } = useTranslation('properties');
  const photo = photos[index];
  const hasMultiple = photos.length > 1;
  const touchStartX = useRef<number | null>(null);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const goToPrevious = () => {
    setDirection('prev');
    onIndexChange((index - 1 + photos.length) % photos.length);
  };

  const goToNext = () => {
    setDirection('next');
    onIndexChange((index + 1) % photos.length);
  };

  const handleTouchStart = (e: ReactTouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: ReactTouchEvent) => {
    if (touchStartX.current === null || !hasMultiple) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    const SWIPE_THRESHOLD = 50;
    if (deltaX > SWIPE_THRESHOLD) {
      goToPrevious();
    } else if (deltaX < -SWIPE_THRESHOLD) {
      goToNext();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (hasMultiple && e.key === 'ArrowLeft') goToPrevious();
      if (hasMultiple && e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, photos.length, hasMultiple, onClose, onIndexChange]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {hasMultiple && (
        <p className="absolute left-1/2 top-4 -translate-x-1/2 text-sm font-medium text-white/80">
          {index + 1}/{photos.length}
        </p>
      )}

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
            goToPrevious();
          }}
          aria-label={t('photos.ariaPrevious')}
          className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4 sm:h-14 sm:w-14"
        >
          <ChevronLeft className="h-7 w-7 sm:h-9 sm:w-9" aria-hidden="true" />
        </button>
      )}

      <img
        key={index}
        src={cloudinaryUrl(photo.url, { w: 1400 })}
        onClick={(e) => e.stopPropagation()}
        alt=""
        className={`max-h-full max-w-full object-contain ${
          direction === 'next' ? 'animate-slide-in-right' : 'animate-slide-in-left'
        }`}
      />

      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          aria-label={t('photos.ariaNext')}
          className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4 sm:h-14 sm:w-14"
        >
          <ChevronRight className="h-7 w-7 sm:h-9 sm:w-9" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
