import { ConfigService } from '@nestjs/config';
import { NominatimService } from './nominatim.service';

describe('NominatimService', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          province: 'Ankara',
          county: 'Çankaya',
          neighbourhood: 'Kızılay',
          road: 'Atatürk Bulvarı',
        },
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  function makeService() {
    const config = { get: () => 'EmlakPanel/1.0 (test)' } as unknown as ConfigService;
    return new NominatimService(config);
  }

  it('aynı koordinat (~4 ondalık) için Nominatim ikinci kez çağrılmaz (cache)', async () => {
    const service = makeService();

    const first = await service.reverse(39.9208, 32.8541);
    const second = await service.reverse(39.92081, 32.85409);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(first).toEqual({
      province: 'Ankara',
      district: 'Çankaya',
      neighborhood: 'Kızılay',
      street: 'Atatürk Bulvarı',
    });
  });

  it('farklı koordinat için tekrar Nominatim çağrılır', async () => {
    const service = makeService();

    await service.reverse(39.9208, 32.8541);
    await service.reverse(41.0082, 28.9784);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('Nominatim hata döndürürse (HTTP olmayan) boş sonuç döner, exception fırlatmaz', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    const service = makeService();

    const result = await service.reverse(10, 10);

    expect(result).toEqual({
      province: undefined,
      district: undefined,
      neighborhood: undefined,
      street: undefined,
    });
  });

  it('Nominatim non-ok HTTP durumunda boş sonuç döner', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
    const service = makeService();

    const result = await service.reverse(20, 20);

    expect(result).toEqual({
      province: undefined,
      district: undefined,
      neighborhood: undefined,
      street: undefined,
    });
  });
});
