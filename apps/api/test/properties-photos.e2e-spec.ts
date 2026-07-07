import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { CloudinaryService } from './../src/photos/cloudinary.service';

const KONYA_AGENT = { email: 'agent@konyaemlak.dev', password: 'Password123!' };
const KONYA_ADMIN = { email: 'admin@konyaemlak.dev', password: 'Password123!' };
const ISTANBUL_AGENT = { email: 'agent@istanbulemlak.dev', password: 'Password123!' };

const mockCloudinaryService = {
  createSignature: jest.fn(() => ({
    signature: 'mock-signature',
    apiKey: 'mock-api-key',
    cloudName: 'mock-cloud',
  })),
  destroy: jest.fn(() => Promise.resolve()),
};

describe('Properties photos (e2e, Cloudinary mocked)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let konyaAgentToken: string;
  let konyaOrganizationId: string;
  let konyaAdminToken: string;
  let istanbulAgentToken: string;
  let konyaPropertyId: string;
  const createdPropertyIds: string[] = [];

  async function login(email: string, password: string) {
    const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
    return res.body as { accessToken: string; user: { organizationId: string } };
  }

  function authed(method: 'get' | 'post' | 'patch' | 'delete', path: string, token: string) {
    return request(app.getHttpServer())
      [method](path)
      .set('Authorization', `Bearer ${token}`);
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CloudinaryService)
      .useValue(mockCloudinaryService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get(PrismaService);

    const konyaAgentLogin = await login(KONYA_AGENT.email, KONYA_AGENT.password);
    konyaAgentToken = konyaAgentLogin.accessToken;
    konyaOrganizationId = konyaAgentLogin.user.organizationId;
    konyaAdminToken = (await login(KONYA_ADMIN.email, KONYA_ADMIN.password)).accessToken;
    istanbulAgentToken = (await login(ISTANBUL_AGENT.email, ISTANBUL_AGENT.password)).accessToken;

    const createRes = await authed('post', '/properties', konyaAgentToken).send({
      title: 'Fotoğraf Test Taşınmazı',
      propertyType: 'APARTMENT',
      listingType: 'SALE',
      price: 100000,
      city: 'Konya',
      district: 'Selçuklu',
      neighborhood: 'Test Mah.',
      addressText: 'Test Adres',
      latitude: 37.87,
      longitude: 32.49,
    });
    konyaPropertyId = createRes.body.id;
    createdPropertyIds.push(konyaPropertyId);
  });

  afterAll(async () => {
    await prisma.propertyPhoto.deleteMany({ where: { propertyId: { in: createdPropertyIds } } });
    await prisma.property.deleteMany({ where: { id: { in: createdPropertyIds } } });
    await app.close();
  });

  function validPublicId(propertyId: string, suffix: string) {
    return `emlakpanel/${konyaOrganizationId}/${propertyId}/${suffix}`;
  }

  describe('Tenant izolasyonu', () => {
    it("Org B, Org A'nın property'si için imza isteyemez -> 404", async () => {
      const res = await authed(
        'post',
        `/properties/${konyaPropertyId}/photos/signature`,
        istanbulAgentToken,
      );
      expect(res.status).toBe(404);
    });

    it("Org B, Org A'nın property'sine fotoğraf kaydı oluşturamaz -> 404", async () => {
      const res = await authed(
        'post',
        `/properties/${konyaPropertyId}/photos`,
        istanbulAgentToken,
      ).send({
        cloudinaryPublicId: validPublicId(konyaPropertyId, 'x'),
        url: 'https://res.cloudinary.com/mock-cloud/image/upload/v1/x.jpg',
      });
      expect(res.status).toBe(404);
    });
  });

  describe('Signature', () => {
    it('geçerli property için imza döner (mock)', async () => {
      const res = await authed(
        'post',
        `/properties/${konyaPropertyId}/photos/signature`,
        konyaAgentToken,
      );
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        signature: 'mock-signature',
        apiKey: 'mock-api-key',
        cloudName: 'mock-cloud',
        folder: `emlakpanel/${konyaOrganizationId}/${konyaPropertyId}`,
      });
    });
  });

  describe('Fotoğraf kaydı oluşturma', () => {
    it('yanlış folder önekli publicId -> 400', async () => {
      const res = await authed('post', `/properties/${konyaPropertyId}/photos`, konyaAgentToken).send({
        cloudinaryPublicId: 'emlakpanel/baska-org/baska-property/x',
        url: 'https://res.cloudinary.com/mock-cloud/image/upload/v1/x.jpg',
      });
      expect(res.status).toBe(400);
    });

    it('ilk fotoğraf otomatik kapak olur', async () => {
      const res = await authed('post', `/properties/${konyaPropertyId}/photos`, konyaAgentToken).send({
        cloudinaryPublicId: validPublicId(konyaPropertyId, 'photo-1'),
        url: 'https://res.cloudinary.com/mock-cloud/image/upload/v1/photo-1.jpg',
      });
      expect(res.status).toBe(201);
      expect(res.body.isCover).toBe(true);
    });

    it('ikinci fotoğraf kapak olmaz', async () => {
      const res = await authed('post', `/properties/${konyaPropertyId}/photos`, konyaAgentToken).send({
        cloudinaryPublicId: validPublicId(konyaPropertyId, 'photo-2'),
        url: 'https://res.cloudinary.com/mock-cloud/image/upload/v1/photo-2.jpg',
      });
      expect(res.status).toBe(201);
      expect(res.body.isCover).toBe(false);
    });

    it('property detayı fotoğrafları sıralı döner', async () => {
      const res = await authed('get', `/properties/${konyaPropertyId}`, konyaAgentToken);
      expect(res.status).toBe(200);
      expect(res.body.photos).toHaveLength(2);
      expect(res.body.photos[0].isCover).toBe(true);
    });

    it('20 fotoğraf limiti aşılınca 400 döner', async () => {
      const limitPropertyRes = await authed('post', '/properties', konyaAgentToken).send({
        title: 'Limit Test Taşınmazı',
        propertyType: 'APARTMENT',
        listingType: 'SALE',
        price: 100000,
        city: 'Konya',
        district: 'Selçuklu',
        neighborhood: 'Test Mah.',
        addressText: 'Test Adres',
        latitude: 37.87,
        longitude: 32.49,
      });
      const limitPropertyId = limitPropertyRes.body.id;
      createdPropertyIds.push(limitPropertyId);

      await prisma.propertyPhoto.createMany({
        data: Array.from({ length: 20 }, (_, i) => ({
          propertyId: limitPropertyId,
          cloudinaryPublicId: validPublicId(limitPropertyId, `bulk-${i}`),
          url: `https://res.cloudinary.com/mock-cloud/image/upload/v1/bulk-${i}.jpg`,
          isCover: i === 0,
          sortOrder: i,
        })),
      });

      const signatureRes = await authed(
        'post',
        `/properties/${limitPropertyId}/photos/signature`,
        konyaAgentToken,
      );
      expect(signatureRes.status).toBe(400);

      const createRes = await authed(
        'post',
        `/properties/${limitPropertyId}/photos`,
        konyaAgentToken,
      ).send({
        cloudinaryPublicId: validPublicId(limitPropertyId, 'bulk-21'),
        url: 'https://res.cloudinary.com/mock-cloud/image/upload/v1/bulk-21.jpg',
      });
      expect(createRes.status).toBe(400);
    });
  });

  describe('Kapak değiştirme ve silme', () => {
    it('kapak değiştirme tek-kapak kuralını koruyor', async () => {
      const detail = await authed('get', `/properties/${konyaPropertyId}`, konyaAdminToken);
      const [firstPhoto, secondPhoto] = detail.body.photos;
      expect(firstPhoto.isCover).toBe(true);
      expect(secondPhoto.isCover).toBe(false);

      const coverRes = await authed(
        'patch',
        `/photos/${secondPhoto.id}/cover`,
        konyaAdminToken,
      );
      expect(coverRes.status).toBe(200);
      expect(coverRes.body.isCover).toBe(true);

      const afterDetail = await authed('get', `/properties/${konyaPropertyId}`, konyaAdminToken);
      const photos = afterDetail.body.photos as { id: string; isCover: boolean }[];
      expect(photos.find((p) => p.id === firstPhoto.id)?.isCover).toBe(false);
      expect(photos.find((p) => p.id === secondPhoto.id)?.isCover).toBe(true);
    });

    it("başka org'un fotoğrafı silinemez/kapak yapılamaz -> 404", async () => {
      const detail = await authed('get', `/properties/${konyaPropertyId}`, konyaAgentToken);
      const photoId = detail.body.photos[0].id;

      const coverRes = await authed('patch', `/photos/${photoId}/cover`, istanbulAgentToken);
      expect(coverRes.status).toBe(404);

      const deleteRes = await authed('delete', `/photos/${photoId}`, istanbulAgentToken);
      expect(deleteRes.status).toBe(404);
    });

    it('kapak fotoğraf silinince kalan en eski fotoğraf otomatik kapak olur', async () => {
      const detail = await authed('get', `/properties/${konyaPropertyId}`, konyaAgentToken);
      const photos = detail.body.photos as { id: string; isCover: boolean }[];
      const cover = photos.find((p) => p.isCover)!;
      const other = photos.find((p) => !p.isCover)!;

      const deleteRes = await authed('delete', `/photos/${cover.id}`, konyaAgentToken);
      expect(deleteRes.status).toBe(204);
      expect(mockCloudinaryService.destroy).toHaveBeenCalled();

      const afterDetail = await authed('get', `/properties/${konyaPropertyId}`, konyaAgentToken);
      const remaining = afterDetail.body.photos as { id: string; isCover: boolean }[];
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(other.id);
      expect(remaining[0].isCover).toBe(true);
    });
  });
});
