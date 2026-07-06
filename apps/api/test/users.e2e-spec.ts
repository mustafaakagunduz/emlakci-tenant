import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const KONYA_ADMIN = { email: 'admin@konyaemlak.dev', password: 'Password123!' };
const KONYA_AGENT = { email: 'agent@konyaemlak.dev', password: 'Password123!' };
const ISTANBUL_ADMIN = { email: 'admin@istanbulemlak.dev', password: 'Password123!' };
const ISTANBUL_AGENT_EMAIL = 'agent@istanbulemlak.dev';

describe('Org-scoped Users (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let konyaAdminToken: string;
  let konyaAgentToken: string;
  let istanbulAdminToken: string;
  const createdEmails: string[] = [];

  async function login(email: string, password: string) {
    const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
    return res.body.accessToken as string;
  }

  function authed(method: 'get' | 'post' | 'patch', path: string, token: string) {
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

    konyaAdminToken = await login(KONYA_ADMIN.email, KONYA_ADMIN.password);
    konyaAgentToken = await login(KONYA_AGENT.email, KONYA_AGENT.password);
    istanbulAdminToken = await login(ISTANBUL_ADMIN.email, ISTANBUL_ADMIN.password);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    await app.close();
  });

  it("AGENT /users endpoint'lerine erişemez -> 403", async () => {
    const getRes = await authed('get', '/users', konyaAgentToken);
    expect(getRes.status).toBe(403);

    const postRes = await authed('post', '/users', konyaAgentToken).send({
      fullName: 'x',
      email: 'x@x.dev',
      password: 'Password123!',
      role: 'AGENT',
    });
    expect(postRes.status).toBe(403);
  });

  it("ORG_ADMIN kendi org'una kullanıcı açabilir", async () => {
    const email = 'e2e-konya-agent@testorg.dev';
    createdEmails.push(email);

    const res = await authed('post', '/users', konyaAdminToken).send({
      fullName: 'E2E Konya Agent',
      email,
      password: 'Password123!',
      role: 'AGENT',
    });
    expect(res.status).toBe(201);
    expect(res.body.organizationId).toBe('konya-emlak-org');
  });

  it("ORG_ADMIN kendi org'unun kullanıcı listesini görür, diğer org'un kullanıcıları listede yok", async () => {
    const res = await authed('get', '/users?limit=100', konyaAdminToken);
    expect(res.status).toBe(200);
    expect(
      res.body.data.every((u: { organizationId: string }) => u.organizationId === 'konya-emlak-org'),
    ).toBe(true);
    expect(res.body.data.some((u: { email: string }) => u.email === ISTANBUL_AGENT_EMAIL)).toBe(
      false,
    );
  });

  it("ORG_ADMIN başka org'un kullanıcısını güncelleyemez -> 404", async () => {
    const istanbulAgent = await prisma.user.findFirstOrThrow({
      where: { organizationId: 'istanbul-emlak-org', role: 'AGENT' },
    });
    const res = await authed('patch', `/users/${istanbulAgent.id}`, konyaAdminToken).send({
      fullName: 'Hacklenmiş İsim',
    });
    expect(res.status).toBe(404);
  });

  it("ORG_ADMIN kendi org'undaki kullanıcıyı güncelleyebilir", async () => {
    const konyaAgent = await prisma.user.findFirstOrThrow({
      where: { email: KONYA_AGENT.email },
    });
    const res = await authed('patch', `/users/${konyaAgent.id}`, konyaAdminToken).send({
      fullName: 'Konya Emlak Danışmanı (güncellendi)',
    });
    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Konya Emlak Danışmanı (güncellendi)');

    // isim eski haline döndürülür ki diğer testler etkilenmesin
    await authed('patch', `/users/${konyaAgent.id}`, konyaAdminToken).send({
      fullName: 'Konya Emlak Danışmanı',
    });
  });

  it("istanbul org admin, konya org'una kullanıcı göremez", async () => {
    const res = await authed('get', '/users?limit=100', istanbulAdminToken);
    expect(res.status).toBe(200);
    expect(
      res.body.data.every(
        (u: { organizationId: string }) => u.organizationId === 'istanbul-emlak-org',
      ),
    ).toBe(true);
  });
});
