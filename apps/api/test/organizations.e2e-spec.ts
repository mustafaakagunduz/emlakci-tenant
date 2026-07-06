import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const SUPER_ADMIN = {
  email: 'superadmin@emlakpanel.dev',
  password: 'Password123!',
};
const AGENT = { email: 'agent@konyaemlak.dev', password: 'Password123!' };
const ORG_ADMIN = { email: 'admin@konyaemlak.dev', password: 'Password123!' };

describe('Organizations (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let superAdminToken: string;
  const createdOrgIds: string[] = [];
  const createdUserEmails: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get(PrismaService);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send(SUPER_ADMIN);
    superAdminToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: createdUserEmails } } });
    await prisma.organization.deleteMany({ where: { id: { in: createdOrgIds } } });
    await app.close();
  });

  function authed(method: 'get' | 'post' | 'patch', path: string, token = superAdminToken) {
    return request(app.getHttpServer())
      [method](path)
      .set('Authorization', `Bearer ${token}`);
  }

  it('ORG_ADMIN token ile organizations endpoint 403 döner', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send(ORG_ADMIN);
    const res = await authed('get', '/organizations', loginRes.body.accessToken);
    expect(res.status).toBe(403);
  });

  it('yeni organizasyon oluşturur', async () => {
    const res = await authed('post', '/organizations').send({
      name: 'Test Org E2E',
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Org E2E');
    createdOrgIds.push(res.body.id);
  });

  it('organizasyon listesi kullanıcı sayısıyla döner', async () => {
    const res = await authed('get', '/organizations?page=1&limit=50');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toEqual({ page: 1, limit: 50, total: expect.any(Number) });
    const org = res.body.data.find((o: { id: string }) => o.id === createdOrgIds[0]);
    expect(org._count.users).toBe(0);
  });

  it('org içine org admin açar ve o hesapla login olunabiliyor', async () => {
    const orgId = createdOrgIds[0];
    const email = 'e2e-org-admin@testorg.dev';
    createdUserEmails.push(email);

    const createRes = await authed('post', `/organizations/${orgId}/users`).send({
      fullName: 'E2E Org Admin',
      email,
      password: 'Password123!',
      role: 'ORG_ADMIN',
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.passwordHash).toBeUndefined();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Password123!' });
    expect(loginRes.status).toBe(201);
    expect(loginRes.body.user.role).toBe('ORG_ADMIN');
    expect(loginRes.body.user.organizationId).toBe(orgId);
  });

  it('aynı email ile ikinci kullanıcı 409 döner', async () => {
    const orgId = createdOrgIds[0];
    const res = await authed('post', `/organizations/${orgId}/users`).send({
      fullName: 'Duplicate',
      email: 'e2e-org-admin@testorg.dev',
      password: 'Password123!',
      role: 'AGENT',
    });
    expect(res.status).toBe(409);
  });

  it('org pasifleştirilince altındaki kullanıcı login olamaz ve mevcut token /auth/me 401 döner', async () => {
    const orgId = createdOrgIds[0];
    const email = 'e2e-org-admin@testorg.dev';

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Password123!' });
    const userToken = loginRes.body.accessToken;

    const meBeforeRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(meBeforeRes.status).toBe(200);

    const patchRes = await authed('patch', `/organizations/${orgId}`).send({
      isActive: false,
    });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.isActive).toBe(false);

    const loginAfterRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Password123!' });
    expect(loginAfterRes.status).toBe(401);

    const meAfterRes = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(meAfterRes.status).toBe(401);
  });

  it('Super Admin kendi hesabını pasifleştiremez', async () => {
    const meRes = await authed('get', '/auth/me');
    const res = await authed('patch', `/users/${meRes.body.id}`).send({
      isActive: false,
    });
    expect(res.status).toBe(403);
  });
});
