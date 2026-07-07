import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenancy/tenant-context';
import { PropertiesService } from '../properties/properties.service';
import { CloudinaryService } from './cloudinary.service';
import { CreatePhotoDto } from './dto/create-photo.dto';

const MAX_PHOTOS_PER_PROPERTY = 20;

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContext,
    private readonly cloudinary: CloudinaryService,
    private readonly propertiesService: PropertiesService,
  ) {}

  private folderFor(propertyId: string): string {
    return `emlakpanel/${this.tenant.organizationId}/${propertyId}`;
  }

  /**
   * photoId üzerinden gelen istekler (kapak yap / sil) için tenant kontrolü:
   * fotoğrafın bağlı olduğu property'nin bu org'a ait ve soft-delete edilmemiş
   * olması gerekir — TenantContext.scopeWhere ile nested ilişki üzerinden.
   */
  private async findPhotoOrThrow(photoId: string) {
    const photo = await this.prisma.propertyPhoto.findFirst({
      where: { id: photoId, property: this.tenant.scopeWhere({ deletedAt: null }) },
    });

    if (!photo) {
      throw new NotFoundException('Fotoğraf bulunamadı');
    }

    return photo;
  }

  private async ensureUnderLimit(propertyId: string) {
    const count = await this.prisma.propertyPhoto.count({ where: { propertyId } });
    if (count >= MAX_PHOTOS_PER_PROPERTY) {
      throw new BadRequestException(
        `Bir taşınmaza en fazla ${MAX_PHOTOS_PER_PROPERTY} fotoğraf eklenebilir`,
      );
    }
    return count;
  }

  async createSignature(propertyId: string) {
    await this.propertiesService.findOne(propertyId);
    await this.ensureUnderLimit(propertyId);

    const folder = this.folderFor(propertyId);
    const timestamp = Math.round(Date.now() / 1000);
    const { signature, apiKey, cloudName } = this.cloudinary.createSignature({
      timestamp,
      folder,
    });

    return { timestamp, signature, apiKey, cloudName, folder };
  }

  async create(propertyId: string, dto: CreatePhotoDto) {
    await this.propertiesService.findOne(propertyId);

    const folder = this.folderFor(propertyId);
    if (!dto.cloudinaryPublicId.startsWith(`${folder}/`)) {
      throw new BadRequestException('Geçersiz fotoğraf klasörü');
    }

    const count = await this.ensureUnderLimit(propertyId);

    return this.prisma.propertyPhoto.create({
      data: {
        propertyId,
        cloudinaryPublicId: dto.cloudinaryPublicId,
        url: dto.url,
        isCover: count === 0,
        sortOrder: count,
      },
    });
  }

  async setCover(photoId: string) {
    const photo = await this.findPhotoOrThrow(photoId);

    await this.prisma.$transaction([
      this.prisma.propertyPhoto.updateMany({
        where: { propertyId: photo.propertyId },
        data: { isCover: false },
      }),
      this.prisma.propertyPhoto.update({
        where: { id: photoId },
        data: { isCover: true },
      }),
    ]);

    return this.prisma.propertyPhoto.findUniqueOrThrow({ where: { id: photoId } });
  }

  async remove(photoId: string) {
    const photo = await this.findPhotoOrThrow(photoId);

    await this.cloudinary.destroy(photo.cloudinaryPublicId);
    await this.prisma.propertyPhoto.delete({ where: { id: photoId } });

    if (photo.isCover) {
      const next = await this.prisma.propertyPhoto.findFirst({
        where: { propertyId: photo.propertyId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
      if (next) {
        await this.prisma.propertyPhoto.update({
          where: { id: next.id },
          data: { isCover: true },
        });
      }
    }
  }
}
