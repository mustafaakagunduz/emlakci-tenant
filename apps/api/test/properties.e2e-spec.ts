import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const SUPER_ADMIN = { email: 'superadmin@emlakpanel.dev', password: 'Password123!' };
const KONYA_AGENT = { email: 'agent@konyaemlak.dev', password: 'Password123!' };
const KONYA_ADMIN = { email: 'admin@konyaemlak.dev', password: 'Password123!' };
const ISTANBUL_AGENT = { email: 'agent@istanbulemlak.dev', password: 'Password123!' };

const KONYA_PROPERTY_ID = 'konya-emlak-org-prop-1';
const ISTANBUL_PROPERTY_ID = 'istanbul-emlak-org-prop-1';

describe('Properties (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let superAdminToken: string;
  let konyaAgentToken: string;
  let konyaAdminToken: string;
  let istanbulAgentToken: string;
  const createdPropertyIds: string[] = [];

  async function login(email: string, password: string) {
    const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
    return res.body.accessToken as string;
  }

  function authed(method: 'get' | 'post' | 'patch' | 'delete', path: string, token: string) {
    return request(app.getHttpServer())
      [method](path)
      .set('Authorization', `Bearer ${token}`);
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get(PrismaService);

    superAdminToken = await login(SUPER_ADMIN.email, SUPER_ADMIN.password);
    konyaAgentToken = await login(KONYA_AGENT.email, KONYA_AGENT.password);
    konyaAdminToken = await login(KONYA_ADMIN.email, KONYA_ADMIN.password);
    istanbulAgentToken = await login(ISTANBUL_AGENT.email, ISTANBUL_AGENT.password);
  });

  afterAll(async () => {
    await prisma.property.deleteMany({ where: { id: { in: createdPropertyIds } } });
    await app.close();
  });

  describe('Tenant izolasyonu', () => {
    it("Org A, Org B'nin property'sini id ile GET edemez -> 404", async () => {
      const res = await authed('get', `/properties/${ISTANBUL_PROPERTY_ID}`, konyaAgentToken);
      expect(res.status).toBe(404);
    });

    it("Org A, Org B'nin property'sini PATCH edemez -> 404", async () => {
      const res = await authed('patch', `/properties/${ISTANBUL_PROPERTY_ID}`, konyaAgentToken).send(
        { title: 'Hacklenmiş Başlık' },
      );
      expect(res.status).toBe(404);
    });

    it("Org A, Org B'nin property'sini DELETE edemez -> 404", async () => {
      const res = await authed('delete', `/properties/${ISTANBUL_PROPERTY_ID}`, konyaAgentToken);
      expect(res.status).toBe(404);
    });

    it("Org A'nın listesi yalnızca kendi kayıtlarını döner", async () => {
      const res = await authed('get', '/properties?limit=100', konyaAgentToken);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      const foreignIds = res.body.data.filter((p: { id: string }) =>
        p.id.startsWith('istanbul-emlak-org'),
      );
      expect(foreignIds).toHaveLength(0);
    });

    it("SUPER_ADMIN token ile tüm /properties endpoint'leri 403 döner", async () => {
      const listRes = await authed('get', '/properties', superAdminToken);
      expect(listRes.status).toBe(403);

      const getRes = await authed('get', `/properties/${KONYA_PROPERTY_ID}`, superAdminToken);
      expect(getRes.status).toBe(403);

      const createRes = await authed('post', '/properties', superAdminToken).send({
        title: 'x',
      });
      expect(createRes.status).toBe(403);

      const patchRes = await authed(
        'patch',
        `/properties/${KONYA_PROPERTY_ID}`,
        superAdminToken,
      ).send({ title: 'x' });
      expect(patchRes.status).toBe(403);

      const deleteRes = await authed(
        'delete',
        `/properties/${KONYA_PROPERTY_ID}`,
        superAdminToken,
      );
      expect(deleteRes.status).toBe(403);
    });
  });

  describe('Soft delete', () => {
    let propertyId: string;

    beforeAll(async () => {
      const createRes = await authed('post', '/properties', konyaAgentToken).send({
        title: 'Soft Delete Test Property',
        propertyType: 'APARTMENT',
        listingType: 'SALE',
        price: 100000,
        city: 'Konya',
        district: 'Selçuklu',
        neighborhood: 'Test Mah.',
        addressText: 'Test Adres',
        latitude: 37.87,
        longitude: 32.49,
        roomCount: '2+1',
      });
      propertyId = createRes.body.id;
      createdPropertyIds.push(propertyId);
    });

    it("listede yer alır, silindikten sonra listede yok ve GET 404 döner", async () => {
      const beforeList = await authed('get', '/properties?limit=100', konyaAgentToken);
      expect(beforeList.body.data.some((p: { id: string }) => p.id === propertyId)).toBe(true);

      const deleteRes = await authed('delete', `/properties/${propertyId}`, konyaAgentToken);
      expect(deleteRes.status).toBe(204);

      const getRes = await authed('get', `/properties/${propertyId}`, konyaAgentToken);
      expect(getRes.status).toBe(404);

      const afterList = await authed('get', '/properties?limit=100', konyaAgentToken);
      expect(afterList.body.data.some((p: { id: string }) => p.id === propertyId)).toBe(false);
    });

    it("tekrar delete de 404 döner", async () => {
      const res = await authed('delete', `/properties/${propertyId}`, konyaAgentToken);
      expect(res.status).toBe(404);
    });
  });

  describe('Filtreler', () => {
    it("q araması title/addressText/ownerName üzerinde çalışır", async () => {
      const res = await authed('get', '/properties?q=Villa', konyaAgentToken);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(
        res.body.data.every((p: { title: string }) => p.title.toLowerCase().includes('villa')),
      ).toBe(true);
    });

    it("fiyat aralığı filtresi çalışır", async () => {
      const res = await authed(
        'get',
        '/properties?minPrice=1000000&maxPrice=5000000',
        konyaAgentToken,
      );
      expect(res.status).toBe(200);
      for (const p of res.body.data) {
        expect(Number(p.price)).toBeGreaterThanOrEqual(1000000);
        expect(Number(p.price)).toBeLessThanOrEqual(5000000);
      }
    });

    it("status filtresi çalışır", async () => {
      const res = await authed('get', '/properties?status=SOLD', konyaAgentToken);
      expect(res.status).toBe(200);
      expect(res.body.data.every((p: { status: string }) => p.status === 'SOLD')).toBe(true);
    });
  });

  describe('CRUD temel akış', () => {
    it("ORG_ADMIN taşınmaz oluşturabilir, günceller ve durumu değişir", async () => {
      const createRes = await authed('post', '/properties', konyaAdminToken).send({
        title: 'CRUD Test Property',
        propertyType: 'LAND',
        listingType: 'SALE',
        price: 500000,
        city: 'Konya',
        district: 'Meram',
        neighborhood: 'Test',
        addressText: 'Adres',
        latitude: 37.86,
        longitude: 32.48,
      });
      expect(createRes.status).toBe(201);
      createdPropertyIds.push(createRes.body.id);

      const patchRes = await authed(
        'patch',
        `/properties/${createRes.body.id}`,
        konyaAdminToken,
      ).send({ status: 'SOLD' });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.status).toBe('SOLD');
    });
  });
});
