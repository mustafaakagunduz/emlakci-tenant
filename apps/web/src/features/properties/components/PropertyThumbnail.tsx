import { cloudinaryUrl } from '../../../lib/cloudinary';

interface PropertyThumbnailProps {
  url?: string | null;
  size?: number;
  fill?: boolean;
  rounded?: string;
  className?: string;
}

export function PropertyThumbnail({
  url,
  size = 56,
  fill = false,
  rounded = 'rounded-md',
  className = '',
}: PropertyThumbnailProps) {
  const style = fill ? undefined : { width: size, height: size };
  const sizeClasses = fill ? 'aspect-square h-full w-auto' : '';

  if (!url) {
    return (
      <div
        style={style}
        className={`flex shrink-0 items-center justify-center bg-gray-100 text-gray-300 ${rounded} ${sizeClasses} ${className}`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2">
          <path
            d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="9" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="m5 17 5-5 3 3 4-5 3 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={cloudinaryUrl(url, fill ? { w: 400, h: 400 } : { w: size * 2, h: size * 2 })}
      style={style}
      alt=""
      className={`shrink-0 object-cover ${rounded} ${sizeClasses} ${className}`}
    />
  );
}
