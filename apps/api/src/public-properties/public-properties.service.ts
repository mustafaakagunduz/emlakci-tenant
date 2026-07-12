import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicPropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        title: true,
        propertyType: true,
        listingType: true,
        status: true,
        price: true,
        currency: true,
        city: true,
        district: true,
        neighborhood: true,
        street: true,
        addressText: true,
        latitude: true,
        longitude: true,
        description: true,
        roomCount: true,
        grossM2: true,
        netM2: true,
        buildingAge: true,
        floor: true,
        totalFloors: true,
        heatingType: true,
        monthlyFee: true,
        isFurnished: true,
        zoningStatus: true,
        blockNo: true,
        parcelNo: true,
        createdAt: true,
        photos: {
          select: { id: true, url: true, isCover: true, sortOrder: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Taşınmaz bulunamadı');
    }

    return property;
  }
}
