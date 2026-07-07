interface CloudinaryUrlOptions {
  w?: number;
  h?: number;
}

// Cloudinary secure_url'i olduğu gibi tam bir URL (upload sırasında backend'e
// kaydedilen); thumbnail üretmek için '/upload/' segmentinden hemen sonra bir
// transformation dizisi ekliyoruz (f_auto/q_auto + istenirse boyutlu crop).
export function cloudinaryUrl(url: string, { w, h }: CloudinaryUrlOptions = {}): string {
  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const transform = ['f_auto', 'q_auto', w ? `w_${w}` : null, h ? `h_${h}` : null, w || h ? 'c_fill' : null]
    .filter(Boolean)
    .join(',');

  const insertAt = idx + marker.length;
  return `${url.slice(0, insertAt)}${transform}/${url.slice(insertAt)}`;
}
