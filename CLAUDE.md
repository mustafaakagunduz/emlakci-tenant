# EmlakPanel — Multi-tenant Emlak Portföy Yönetimi

## Bu proje nedir

Türkiye'deki emlak ofislerinin (emlakçıların) portföylerini harita + liste arayüzüyle yönetmesi için bir SaaS yönetim paneli. Her emlak ofisi izole bir **organizasyondur** (tenant). Ürün sahibi (Super Admin) erişimi satar, organizasyonları oluşturur ve org hesaplarını yönetir — ama hiçbir organizasyonun portföy verisini ASLA göremez.

Arayüz dili **Türkçe**. Kod, yorumlar, değişken isimleri ve commit mesajları **İngilizce**.

## Stack (sabit — başka bir şeyle değiştirme)

- **Frontend**: React 18 + Vite + TypeScript, Tailwind CSS, react-leaflet (OpenStreetMap tile'ları), server state için TanStack Query, formlar için react-hook-form + zod, i18n için react-i18next (varsayılan ve tek başlangıç dili: `tr`)
- **Backend**: NestJS + TypeScript, Prisma ORM, PostgreSQL
- **Auth**: JWT (access token), şifreler için bcrypt. MVP'de refresh-token rotasyonu gibi karmaşıklıklar yok — makul ölçüde uzun ömürlü bir access token yeterli.
- **Görseller**: Cloudinary (backend imzalı upload, dönüşümler URL parametresiyle)
- **Lokal geliştirme / deploy**: Docker Compose (postgres + api). Frontend Vercel'e, backend Caddy arkasında bir DigitalOcean droplet'a deploy edilir.

## Repo yapısı

```
/
├── CLAUDE.md
├── docker-compose.yml          # dev: postgres + api
├── docker-compose.prod.yml     # prod: postgres + api + caddy
├── apps/
│   ├── api/                    # NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── auth/
│   │       ├── organizations/
│   │       ├── users/
│   │       ├── properties/
│   │       ├── photos/
│   │       └── common/         # guard'lar, decorator'lar, interceptor'lar, filter'lar
│   └── web/                    # React + Vite
│       └── src/
│           ├── api/            # API client, TanStack Query hook'ları
│           ├── components/     # paylaşılan reusable componentler (ui/, map/, layout/)
│           ├── features/       # feature modülleri: auth/, properties/, admin/, org-users/
│           ├── pages/          # route seviyesindeki componentler
│           ├── hooks/
│           └── lib/            # util'ler, sabitler, tipler
```

## Temel mimari kurallar

### Multi-tenancy (bu kod tabanındaki EN önemli kural)

- Tek veritabanı, tek şema. Tenant'a ait her tabloda `organizationId` kolonu vardır.
- Tenant izolasyonu endpoint bazında değil, **merkezi** olarak uygulanır:
  - JWT payload'ı `{ sub, organizationId, role }` taşır.
  - Global bir `TenancyGuard` + request-scoped bir context, `organizationId`'yi her yerde erişilebilir kılar.
  - Tenant verisine dokunan servis metodları, Prisma `where` koşullarına `organizationId`'yi HER ZAMAN otomatik ekleyen ince bir repository/helper katmanından geçmelidir. Tenant verisi sorgusunda `organizationId`'yi asla request body/params'tan alma — her zaman JWT'den al.
- Elle hazırlanmış (crafted) bir istekle bile tenant'lar arası erişim imkânsız olmalı (örn. başka org'un property'sini id ile çekmeye çalışmak 404 döner, 403 değil — kaydın varlığını sızdırma).
- Super Admin'in `organizationId`'si `null`'dır ve yalnızca `Organization` ve `User` kaynaklarına dokunabilir. Super Admin'in `Property` veya `PropertyPhoto` verisi okuyabileceği HİÇBİR endpoint olmamalıdır.

### Roller

| Rol | Neler yapabilir |
|---|---|
| `SUPER_ADMIN` | Organizasyon CRUD; herhangi bir org içinde kullanıcı CRUD (org admin oluşturma); portföye kesinlikle erişemez |
| `ORG_ADMIN` | Kendi org'undaki kullanıcıları yönetir (agent ekleme/pasifleştirme); kendi org'unda tam portföy erişimi |
| `AGENT` | Kendi org'unda tam portföy erişimi (taşınmaz ekleme/düzenleme/arşivleme) |

Tek bir `@Roles(...)` decorator'ı + `RolesGuard` kullan. Permission-matrix / RBAC kütüphanesi yok.

### Veri modelinin özü

- `Organization`: name, isActive, timestamp'ler.
- `User`: email (unique), passwordHash, fullName, role, organizationId (yalnızca SUPER_ADMIN için nullable), isActive.
- `Property`: organizationId, createdById, title, propertyType (enum: APARTMENT, SHOP, LAND, VILLA, OFFICE, BUILDING, OTHER), listingType (enum: SALE, RENT), status (enum: ACTIVE, SOLD, RENTED, PASSIVE), price (Decimal), currency (default TRY), city, district, neighborhood, addressText, latitude, longitude, description, ownerName, ownerPhone (mal sahibinin iletişim bilgisi — ofis içi özel not), artı tipe özgü nullable alanlar: roomCount (string, örn. "3+1"), grossM2, netM2, buildingAge, floor, totalFloors, heatingType, monthlyFee, isFurnished, zoningStatus, blockNo/parcelNo (arsa için), soft delete için `deletedAt`, timestamp'ler.
- `PropertyPhoto`: propertyId, cloudinaryPublicId, url, isCover, sortOrder.
- **Nullable kolonlu tek bir düz Property tablosu.** Tip bazlı ayrı tablolara BÖLME, polimorfizm KULLANMA, JSON attribute blob'u KULLANMA.

### Soft delete

- `Property.deletedAt` timestamp'i. Tüm okumalar `deletedAt: null` filtresi uygular (bunu tenancy ile aynı merkezi sorgu helper'ında zorunlu kıl). Silme endpoint'i timestamp'i set eder. MVP'de hard-delete endpoint'i yok.

## Kod standartları

- **Yalnızca dozunda soyutlama.** Bir şeyi paylaşılan component/helper'a çıkarma kararı, 2+ yerde kullanılıyorsa veya kullanılacağı çok açıksa verilir. Generic framework'ler, plugin sistemleri veya "geleceğe hazırlık" katmanları kurma.
- Backend: standart NestJS modül yapısı (controller / service / dto). DTO validasyonu `class-validator` ile. Bir global exception filter, bir global validation pipe. CQRS yok, event bus yok, microservice yok, hexagonal mimari yok.
- Frontend:
  - Reusable primitive'ler `components/ui/` içinde yaşar (Button, Input, Select, Modal, Badge vb.), Tailwind ile yazılır. Küçük ve prop-driven tut; design-system tooling'i yok.
  - Server state, `api/` içindeki TanStack Query hook'larıyla yönetilir (örn. `useProperties(filters)`, `useCreateProperty()`). Redux/Zustand yok — local state + query cache yeterli.
  - Formlar react-hook-form + zod şemalarıyla; mümkün olduğunda zod şemalarını API tipleriyle paylaş.
  - `z.coerce.number()` kullanılan (parse öncesi/sonrası tipi farklı olan) şemalarda `useForm`'a hem "input" hem "output" tipini ver: `z.input<typeof schema>` ve `z.output<typeof schema>` ayrı export edilip `useForm<Input, unknown, Output>()` şeklinde kullanılır — aksi halde `tsc -b` "iki farklı tip" hatası verir. Optional sayısal alanlarda boş input `''` değeri `z.coerce.number()` tarafından `0`'a çevrilip `.positive()` gibi kuralları kırar; `''`/`null`'ı `undefined`'a çeviren bir `z.preprocess` sarmalayıcısı (bkz. `apps/web/src/features/properties/schema.ts` içindeki `optionalNumber()`) kullan.
  - Harita parçaları (`MapView`, `PropertyMarker`, `LocationPicker`) `components/map/` içinde reusable componentlerdir.
  - i18n: tüm kullanıcıya görünen metinler react-i18next `t()` anahtarlarıyla yazılır, arayüzde hardcoded metin olmaz. Çeviri dosyaları `src/locales/tr/` altında feature bazlı JSON'lardır (örn. `common.json`, `properties.json`, `auth.json`). Şimdilik tek dil `tr`; yapı yeni dil eklemeye hazır olur ama dil değiştirici (language switcher) MVP'de yok.
- API cevapları: düz JSON, listeler için tutarlı `{ data, meta? }` şekli (meta = pagination). Hatalar: NestJS varsayılanı `{ statusCode, message, error }`.
- Pagination: liste endpoint'lerinde basit `page`/`limit` query paramları.
- Env konfigürasyonu `.env` + NestJS `ConfigModule` ile; `.env.example` dosyası sağla ve güncel tut.
- Kodu responsive-first yaz: masaüstünde harita (sol) + liste (sağ); mobilde Harita/Liste toggle'ı ve bottom-sheet tarzı özet kartı.

## YAPMA listesi (açık anti-hedefler)

- ❌ Redis, message queue, cache katmanları
- ❌ Microservice'ler, monorepo tooling'i (Nx/Turbo) — düz klasörler yeterli
- ❌ Tenant başına ayrı veritabanı veya şema
- ❌ RBAC/permission kütüphaneleri, Keycloak, OAuth provider'ları
- ❌ Tip bazlı ayrı Property tabloları veya polimorfik inheritance
- ❌ sahibinden.com entegrasyonu veya herhangi bir scraping
- ❌ SSR/Next.js — bu saf bir SPA
- ❌ Şişirilmiş test piramitleri. Testler odaklı olacak: tenant izolasyonu (kritik, e2e tarzı testler ŞART), auth guard'ları ve temel property servis mantığı. MVP'de snapshot/UI testlerini atla.

## Konvansiyonlar ve iş akışı

- Her şema değişikliği için Prisma migration (`prisma migrate dev`), commit'lenen işte asla `db push` kullanma.
- Seed script'i şunları oluşturur: 1 super admin, her birinde 1 org admin + 1 agent + Konya/İstanbul koordinatları çevresinde birkaç taşınmaz bulunan 2 demo organizasyon — böylece tenant izolasyonu anında test edilebilir.
- Controller'ları ince tut; iş mantığı servislerde.
- Bir görev belirsizse, bu dosyayla tutarlı en basit implementasyonu seç ve sormak yerine kararı özet/PR açıklamasında not et.
- **Hatasız teslim kuralı**: Her görevi bitirmeden önce hem `apps/api` hem `apps/web` için TypeScript kontrolü ve build çalıştır (`npx tsc --noEmit` ve `npm run build`). Sıfır TS hatası ve sıfır build hatası olmadan görevi tamamlanmış sayma. Hataları `any`'e cast ederek, `@ts-ignore`/`@ts-expect-error` ekleyerek veya tsconfig'i gevşeterek susturma — gerçekten düzelt.
- Her fazın sonunda her şey şu komutlarla çalışmalı: `docker compose up -d` (db+api) ve `apps/web` içinde `npm run dev`.
- **API container'ın `node_modules`'ü host'tan izole bir volume** (`docker-compose.yml`: `/app/node_modules`). Host'ta `prisma migrate dev`/`prisma generate` çalıştırmak container içindeki Prisma Client'ı güncellemez — şema değiştikten sonra `docker exec <api-container-adı> npx prisma generate` çalıştır (veya container'ı restart edip generate'i tekrar çalıştır), yoksa container watch-mode'da eski client ile derleme hatası verir.
- Users endpoint'lerinde SUPER_ADMIN ve ORG_ADMIN'in aynı kaynağa (`PATCH /users/:id`) farklı yetkilerle erişmesi gereken durumlarda: ayrı route/controller açma, tek route + `@Roles(SUPER_ADMIN, ORG_ADMIN)` + serviste `currentUser.role`'e göre dallanan tek metod kullan (bkz. `apps/api/src/users/users.service.ts`).