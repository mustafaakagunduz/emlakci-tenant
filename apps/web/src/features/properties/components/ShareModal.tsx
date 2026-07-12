import { useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
}

export function ShareModal({ open, onClose, propertyId }: ShareModalProps) {
  const { t } = useTranslation('properties');
  const [copied, setCopied] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const link = `${window.location.origin}/share/${propertyId}`;

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard || !window.isSecureContext) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(link);
    } catch {
      // Clipboard API başarısız olursa (izin reddi, güvenli olmayan origin
      // vb.) input'taki metni seçip tarayıcının execCommand fallback'iyle
      // kopyalamayı deniyoruz.
      linkInputRef.current?.select();
      const copiedViaFallback = document.execCommand('copy');
      if (!copiedViaFallback) return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal open={open} onClose={onClose} title={t('share.modalTitle')}>
      <p className="text-sm font-medium text-gray-700">{t('share.linkLabel')}</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          ref={linkInputRef}
          type="text"
          readOnly
          value={link}
          title={link}
          onFocus={(e) => e.target.select()}
          onClick={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 truncate rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
        />
        <Button
          type="button"
          className="!px-2.5"
          aria-label={t('share.copyButton')}
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-white" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4 text-white" aria-hidden="true" />
          )}
        </Button>
      </div>
      {copied && (
        <p className="mt-2 flex items-center gap-1 text-xs text-green-600">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {t('share.copied')}
        </p>
      )}
    </Modal>
  );
}
