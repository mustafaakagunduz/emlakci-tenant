import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { NominatimService } from './../src/geo/nominatim.service';

const KONYA_AGENT = { email: 'agent@konyaemlak.dev', password: 'Password123!' };

describe('Geo (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let reverseMock: jest.Mock;

  async function login(email: string, password: string) {
    const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
    return res.body.accessToken as string;
  }

  function authed(path: string) {
    return request(app.getHttpServer()).get(path).set('Authorization', `Bearer ${token}`);
  }

  beforeAll(async () => {
    reverseMock = jest.fn();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NominatimService)
      .useValue({ reverse: reverseMock })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    token = await login(KONYA_AGENT.email, KONYA_AGENT.password);
  });

  afterAll(async () => {
    await app.close();
  });

  it('token olmadan 401 döner', async () => {
    const res = await request(app.getHttpServer()).get('/geo/provinces');
    expect(res.status).toBe(401);
  });

  it('illeri döner ve q ile filtreler', async () => {
    const all = await authed('/geo/provinces');
    expect(all.status).toBe(200);
    expect(all.body.data.length).toBe(81);

    const filtered = await authed('/geo/provinces?q=ank');
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.some((p: { name: string }) => p.name === 'Ankara')).toBe(true);
    expect(filtered.body.data.every((p: { name: string }) => p.name.toLowerCase().includes('ank'))).toBe(
      true,
    );
  });

  it('seçili ile göre ilçeleri döner', async () => {
    const res = await authed('/geo/districts?province=Ankara');
    expect(res.status).toBe(200);
    expect(res.body.data.some((d: { name: string }) => d.name === 'Çankaya')).toBe(true);
  });

  it('bilinmeyen il için boş ilçe listesi döner', async () => {
    const res = await authed('/geo/districts?province=Nonexistent');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('seçili il+ilçeye göre mahalleleri q ile filtreler, max 20 sonuç', async () => {
    const res = await authed('/geo/neighborhoods?province=Ankara&district=Çankaya&q=a');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(20);
  });

  it('reverse geocode Nominatim sonucunu yerel veriyle eşleştirir', async () => {
    reverseMock.mockResolvedValueOnce({
      province: 'Ankara',
      district: 'Çankaya',
      neighborhood: 'Kızılay',
      street: 'Atatürk Bulvarı',
    });

    const res = await authed('/geo/reverse?lat=39.92&lng=32.85');
    expect(res.status).toBe(200);
    expect(res.body.province).toBe('Ankara');
    expect(res.body.district).toBe('Çankaya');
    expect(res.body.neighborhood).toBe('Kızılay');
    expect(res.body.street).toBe('Atatürk Bulvarı');
    expect(reverseMock).toHaveBeenCalledWith(39.92, 32.85);
  });

  it("Nominatim'in \"X Mahallesi\" ekli adını yerel veri setindeki eksiz adla eşleştirir", async () => {
    reverseMock.mockResolvedValueOnce({
      province: 'Ankara',
      district: 'Çankaya',
      neighborhood: 'Namık Kemal Mahallesi',
    });

    const res = await authed('/geo/reverse?lat=39.9199&lng=32.85');
    expect(res.status).toBe(200);
    expect(res.body.neighborhood).toBe('Namık Kemal');
  });

  it('eşleşmeyen alanları null döner (form akışı kırılmaz)', async () => {
    reverseMock.mockResolvedValueOnce({
      province: 'Bilinmeyen Diyar',
      district: undefined,
      neighborhood: undefined,
    });

    const res = await authed('/geo/reverse?lat=1.1&lng=2.2');
    expect(res.status).toBe(200);
    expect(res.body.province).toBeNull();
    expect(res.body.district).toBeNull();
    expect(res.body.neighborhood).toBeNull();
    expect(res.body.street).toBeNull();
  });

});

// Not: Nominatim önbelleğinin gerçekten çalıştığı (aynı koordinata ikinci istek
// gitmediği) src/geo/nominatim.service.spec.ts içinde unit seviyesinde doğrulanıyor
// — burada NominatimService tamamen mock'landığı için o davranış e2e'de test edilemez.
