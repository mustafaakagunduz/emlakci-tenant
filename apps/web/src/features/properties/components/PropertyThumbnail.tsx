import { cloudinaryUrl } from '../../../lib/cloudinary';

interface PropertyThumbnailProps {
  url?: string | null;
  size?: number;
  className?: string;
}

export function PropertyThumbnail({ url, size = 56, className = '' }: PropertyThumbnailProps) {
  const style = { width: size, height: size };

  if (!url) {
    return (
      <div
        style={style}
        className={`flex shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-300 ${className}`}
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
      src={cloudinaryUrl(url, { w: size * 2, h: size * 2 })}
      style={style}
      alt=""
      className={`shrink-0 rounded-md object-cover ${className}`}
    />
  );
}
