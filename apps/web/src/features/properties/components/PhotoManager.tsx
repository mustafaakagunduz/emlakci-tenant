import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../../api/client';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { cloudinaryUrl } from '../../../lib/cloudinary';
import { uploadPropertyPhoto } from '../photoUpload';
import { useDeletePhoto, useSetCoverPhoto } from '../hooks';
import type { PropertyPhoto } from '../types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface UploadItem {
  id: string;
  progress: number;
  status: 'uploading' | 'error';
  error?: string;
}

interface PhotoManagerProps {
  propertyId: string;
  photos: PropertyPhoto[];
}

export function PhotoManager({ propertyId, photos }: PhotoManagerProps) {
  const { t } = useTranslation('properties');
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const setCover = useSetCoverPhoto();
  const deletePhotoMutation = useDeletePhoto();

  const sortedPhotos = [...photos].sort((a, b) => a.sortOrder - b.sortOrder);

  const updateUpload = (id: string, patch: Partial<UploadItem>) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    Array.from(fileList).forEach((file) => {
      const id = `${Date.now()}-${Math.random()}`;

      if (!file.type.startsWith('image/')) {
        setUploads((prev) => [
          ...prev,
          { id, progress: 0, status: 'error', error: t('photos.invalidType') },
        ]);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploads((prev) => [
          ...prev,
          { id, progress: 0, status: 'error', error: t('photos.tooLarge') },
        ]);
        return;
      }

      setUploads((prev) => [...prev, { id, progress: 0, status: 'uploading' }]);

      uploadPropertyPhoto(propertyId, file, (percent) => updateUpload(id, { progress: percent }))
        .then(() => {
          setUploads((prev) => prev.filter((u) => u.id !== id));
          queryClient.invalidateQueries({ queryKey: ['properties'] });
        })
        .catch((err: unknown) => {
          const message =
            err instanceof ApiError && err.status === 503
              ? t('photos.serviceUnavailable')
              : err instanceof ApiError
                ? err.message
                : t('photos.uploadError');
          updateUpload(id, { status: 'error', error: message });
        });
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">{t('photos.title')}</h2>
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
          {t('photos.addButton')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {sortedPhotos.length === 0 && uploads.length === 0 && (
        <p className="text-sm text-gray-500">{t('photos.empty')}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {sortedPhotos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-md border border-gray-200"
          >
            <img
              src={cloudinaryUrl(photo.url, { w: 300, h: 300 })}
              alt=""
              className="h-full w-full object-cover"
            />
            {photo.isCover && (
              <span className="absolute left-1 top-1 rounded-full bg-gray-900/80 px-2 py-0.5 text-xs font-medium text-white">
                {t('photos.cover')}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
              {!photo.isCover && (
                <button
                  type="button"
                  onClick={() => setCover.mutate(photo.id)}
                  className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-gray-900 hover:bg-white"
                >
                  {t('photos.makeCover')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setDeleteTargetId(photo.id)}
                className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-red-600 hover:bg-white"
              >
                {t('photos.delete')}
              </button>
            </div>
          </div>
        ))}

        {uploads.map((upload) => (
          <div
            key={upload.id}
            className="flex aspect-square flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 p-2 text-center"
          >
            {upload.status === 'uploading' ? (
              <>
                <span className="text-xs text-gray-500">
                  {t('photos.uploading')} %{upload.progress}
                </span>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-gray-900 transition-all"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              </>
            ) : (
              <span className="text-xs text-red-600">{upload.error}</span>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        title={t('photos.confirmDeleteTitle')}
        message={t('photos.confirmDeleteMessage')}
        confirmLabel={t('photos.confirm')}
        cancelLabel={t('photos.cancel')}
        variant="danger"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) deletePhotoMutation.mutate(deleteTargetId);
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
}
