import { createPropertyPhoto, fetchPhotoSignature } from './api';
import type { PhotoSignature, PropertyPhoto } from './types';

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
}

// Dosya backend'den GEÇMEZ: imzayı backend'den alıp doğrudan Cloudinary'ye
// yüklüyoruz (XMLHttpRequest, ilerleme yüzdesi için gerekli — fetch'in
// upload progress event'i yok).
function uploadToCloudinary(
  file: File,
  signature: PhotoSignature,
  onProgress: (percent: number) => void,
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', String(signature.timestamp));
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResult);
      } else {
        reject(new Error('Cloudinary yükleme hatası'));
      }
    };
    xhr.onerror = () => reject(new Error('Cloudinary yükleme hatası'));
    xhr.send(formData);
  });
}

export async function uploadPropertyPhoto(
  propertyId: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<PropertyPhoto> {
  const signature = await fetchPhotoSignature(propertyId);
  const uploaded = await uploadToCloudinary(file, signature, onProgress);
  return createPropertyPhoto(propertyId, {
    cloudinaryPublicId: uploaded.public_id,
    url: uploaded.secure_url,
  });
}
