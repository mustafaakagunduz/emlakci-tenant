import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

const SUPER_ADMIN = {
  email: 'superadmin@emlakpanel.dev',
  password: 'Password123!',
};
const AGENT = { email: 'agent@konyaemlak.dev', password: 'Password123!' };

const INACTIVE_USER = {
  email: 'pasif@konyaemlak.dev',
  password: 'Password123!',
};

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get(PrismaService);

    const org = await prisma.organization.findFirstOrThrow();
    await prisma.user.upsert({
      where: { email: INACTIVE_USER.email },
      update: { isActive: false },
      create: {
        email: INACTIVE_USER.email,
        passwordHash: await bcrypt.hash(INACTIVE_USER.password, 10),
        fullName: 'Pasif Kullanıcı',
        role: Role.AGENT,
        organizationId: org.id,
        isActive: false,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { email: INACTIVE_USER.email } });
    await app.close();
  });

  async function login(email: string, password: string) {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
    return res;
  }

  it('doğru bilgilerle login olur ve token döner', async () => {
    const res = await login(AGENT.email, AGENT.password);
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(AGENT.email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('yanlış şifre ile 401 döner', async () => {
    const res = await login(AGENT.email, 'yanlis-sifre');
    expect(res.status).toBe(401);
  });

  it('olmayan email ile de aynı generic hatayı döner', async () => {
    const res = await login('yok@yok.dev', 'herhangi-bir-sifre');
    expect(res.status).toBe(401);
  });

  it('pasif kullanıcı login olamaz', async () => {
    const res = await login(INACTIVE_USER.email, INACTIVE_USER.password);
    expect(res.status).toBe(401);
  });

  it('token olmadan korumalı endpoint 401 döner', async () => {
    const res = await request(app.getHttpServer()).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('/auth/me doğru kullanıcıyı döner', async () => {
    const loginRes = await login(AGENT.email, AGENT.password);
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(AGENT.email);
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('@Roles(SUPER_ADMIN) endpoint: agent token 403 döner', async () => {
    const loginRes = await login(AGENT.email, AGENT.password);
    const res = await request(app.getHttpServer())
      .get('/organizations')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('@Roles(SUPER_ADMIN) endpoint: super admin token 200 döner', async () => {
    const loginRes = await login(SUPER_ADMIN.email, SUPER_ADMIN.password);
    const res = await request(app.getHttpServer())
      .get('/organizations')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);
    expect(res.status).toBe(200);
  });
});
