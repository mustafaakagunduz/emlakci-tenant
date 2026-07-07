import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary SDK'sının tek geçiş noktası: imza üretme + destroy. Env
 * (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET) boşsa uygulama yine ayağa
 * kalkar ama bu servisin herhangi bir metodu anlaşılır bir 503 fırlatır —
 * Cloudinary hesabı olmayan geliştirme ortamı kırılmaz.
 */
@Injectable()
export class CloudinaryService {
  private readonly configured: boolean;
  private readonly cloudName?: string;
  private readonly apiKey?: string;
  private readonly apiSecret?: string;

  constructor(config: ConfigService) {
    this.cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    this.apiKey = config.get<string>('CLOUDINARY_API_KEY');
    this.apiSecret = config.get<string>('CLOUDINARY_API_SECRET');
    this.configured = Boolean(this.cloudName && this.apiKey && this.apiSecret);

    if (this.configured) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
      });
    }
  }

  private ensureConfigured() {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Cloudinary yapılandırılmamış (.env dosyasında CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET eksik)',
      );
    }
  }

  createSignature(paramsToSign: Record<string, string | number>) {
    this.ensureConfigured();
    const signature = cloudinary.utils.api_sign_request(paramsToSign, this.apiSecret!);
    return { signature, apiKey: this.apiKey!, cloudName: this.cloudName! };
  }

  async destroy(publicId: string): Promise<void> {
    this.ensureConfigured();
    await cloudinary.uploader.destroy(publicId);
  }
}
