import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const SUPER_ADMIN = { email: 'superadmin@emlakpanel.dev', password: 'Password123!' };
const KONYA_AGENT = { email: 'agent@konyaemlak.dev', password: 'Password123!' };

describe('Properties map-markers (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let superAdminToken: string;
  let konyaAgentToken: string;
  const createdPropertyIds: string[] = [];

  async function login(email: string, password: string) {
    const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
    return res.body.accessToken as string;
  }

  function authed(method: 'get', path: string, token: string) {
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
  });

  afterAll(async () => {
    await prisma.property.deleteMany({ where: { id: { in: createdPropertyIds } } });
    await app.close();
  });

  it("SUPER_ADMIN token ile 403 döner", async () => {
    const res = await authed('get', '/properties/map-markers', superAdminToken);
    expect(res.status).toBe(403);
  });

  it("yalnızca kendi org'unun marker'larını döner (tenant izolasyonu)", async () => {
    const res = await authed('get', '/properties/map-markers', konyaAgentToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const foreignIds = res.body.filter((p: { id: string }) =>
      p.id.startsWith('istanbul-emlak-org'),
    );
    expect(foreignIds).toHaveLength(0);
  });

  it("pagination meta'sı olmadan hafif shape döner", async () => {
    const res = await authed('get', '/properties/map-markers', konyaAgentToken);
    expect(res.status).toBe(200);
    expect(res.body.meta).toBeUndefined();
    const marker = res.body[0];
    expect(Object.keys(marker).sort()).toEqual(
      [
        'currency',
        'district',
        'id',
        'latitude',
        'listingType',
        'longitude',
        'price',
        'propertyType',
        'status',
        'title',
      ].sort(),
    );
  });

  it('status filtresi marker sonucunu daraltır', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${konyaAgentToken}`)
      .send({
        title: 'Map Marker Filter Test',
        propertyType: 'APARTMENT',
        listingType: 'SALE',
        status: 'PASSIVE',
        price: 250000,
        city: 'Konya',
        district: 'Selçuklu',
        neighborhood: 'Test Mah.',
        addressText: 'Test Adres',
        latitude: 37.87,
        longitude: 32.49,
      });
    createdPropertyIds.push(createRes.body.id);

    const res = await authed('get', '/properties/map-markers?status=PASSIVE', konyaAgentToken);
    expect(res.status).toBe(200);
    expect(res.body.some((p: { id: string }) => p.id === createRes.body.id)).toBe(true);
    expect(res.body.every((p: { status: string }) => p.status === 'PASSIVE')).toBe(true);
  });

  it('q araması marker sonucuna da uygulanır', async () => {
    const res = await authed('get', '/properties/map-markers?q=Villa', konyaAgentToken);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(
      res.body.every((p: { title: string }) => p.title.toLowerCase().includes('villa')),
    ).toBe(true);
  });

  it('fiyat aralığı filtresi marker sonucuna da uygulanır', async () => {
    const res = await authed(
      'get',
      '/properties/map-markers?minPrice=1000000&maxPrice=5000000',
      konyaAgentToken,
    );
    expect(res.status).toBe(200);
    for (const p of res.body) {
      expect(Number(p.price)).toBeGreaterThanOrEqual(1000000);
      expect(Number(p.price)).toBeLessThanOrEqual(5000000);
    }
  });
});
