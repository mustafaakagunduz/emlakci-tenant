# EmlakPanel — İlerleme Durumu

## 1. Tamamlanan fazlar
- **Faz 0**: Proje iskeleti (apps/api NestJS, apps/web Vite+React, Docker Compose) — tam.
- **Faz 1**: Auth + multi-tenancy çekirdeği (login, guard'lar, TenantContext, seed, testler) — tam, browser-doğrulanmış.
- **Faz 2**: Super Admin paneli (org/user CRUD, org pasifleştirme kilidi, admin UI) — tam, 20/20 backend testi geçiyor, browser-doğrulanmış.
- **Faz 3**: Property CRUD + org içi kullanıcı yönetimi — tam, 33/33 e2e testi geçiyor (app 1 + auth 8 + organizations 7 + properties 11 + users 6 = 33), browser-doğrulanmış (Playwright ile golden path).
- **Faz 4**: Ana ekran (harita + liste), taşınmaz detay sayfası, mobil responsive — tam, 39/39 e2e testi geçiyor (Faz 3'teki 33 + yeni properties-map 6), browser-doğrulanmış (Playwright ile masaüstü + ~390px mobil golden path, tenant izolasyonu görsel olarak da doğrulandı).

## 2. Guard mimarisi ve TenantContext kullanımı
- `JwtAuthGuard` (`apps/api/src/auth/guards/jwt-auth.guard.ts`) + `RolesGuard` (`apps/api/src/auth/guards/roles.guard.ts`) `APP_GUARD` ile **global** kayıtlı (`apps/api/src/app.module.ts`). Her yeni endpoint varsayılan korumalı; açmak için `@Public()` (`apps/api/src/auth/decorators/public.decorator.ts`), rol kısıtı için `@Roles(...)` (`apps/api/src/auth/decorators/roles.decorator.ts`).
- `@CurrentUser()` (`apps/api/src/auth/decorators/current-user.decorator.ts`) controller'da JWT payload'ı (`{sub, organizationId, role}`) verir.
- **TenantContext** (`apps/api/src/common/tenancy/tenant-context.ts`, `@Injectable({scope: Scope.REQUEST})`, `TenancyModule` ile global export): `PropertiesService` (`apps/api/src/properties/properties.service.ts`) tüm okuma sorgularını tek bir `scopeActive()` private helper'ından geçirir:
  ```ts
  private scopeActive(where: Prisma.PropertyWhereInput = {}) {
    return this.tenant.scopeWhere({ ...where, deletedAt: null });
  }
  ```
  Böylece `organizationId` (JWT'den) ve `deletedAt: null` her okuma sorgusuna merkezi ve istisnasız uygulanıyor; endpoint'lerde tekrarlanmıyor.
  `scopeWhere()` / `organizationId` getter'ı Super Admin (organizationId=null) ile çağrılırsa `ForbiddenException` fırlatır — Property'ye Super Admin erişimi yapısal olarak imkânsız (ve `@Roles(ORG_ADMIN, AGENT)` zaten SUPER_ADMIN'i 403'le engelliyor, TenantContext ikinci bir savunma katmanı).
- `findOne` başka org'un veya soft-deleted kaydını `findFirst` ile arar; bulunamazsa 404 döner (403 değil) — kayıt varlığı hiçbir yoldan sızmıyor.

## 3. Mevcut endpoint'ler
- `POST /auth/login` (public), `GET /auth/me`
- `POST /organizations`, `GET /organizations`, `GET /organizations/:id`, `PATCH /organizations/:id` — hepsi `@Roles(SUPER_ADMIN)`
- `POST /organizations/:id/users` — `@Roles(SUPER_ADMIN)` (Super Admin herhangi bir org'a kullanıcı açar)
- `POST /users`, `GET /users` — `@Roles(ORG_ADMIN)` (kendi org'una kullanıcı açar / kendi org'unun kullanıcılarını listeler, JWT'deki organizationId'den scoped)
- `PATCH /users/:id` — `@Roles(SUPER_ADMIN, ORG_ADMIN)`, tek controller/tek route, davranış `UsersService.update` içinde currentUser.role'e göre dallanıyor (SUPER_ADMIN → tüm kullanıcılar; ORG_ADMIN → yalnızca kendi org'u, aksi halde 404)
- `POST /properties`, `GET /properties`, `GET /properties/:id`, `PATCH /properties/:id`, `DELETE /properties/:id` (soft delete, 204) — hepsi `@Roles(ORG_ADMIN, AGENT)`, Super Admin bilinçli olarak dışarıda
- `GET /health` (public)

## 4. Users endpoint çakışması nasıl çözüldü (Faz 3 görev notu)
Faz 2'de `PATCH /users/:id` yalnızca SUPER_ADMIN'e aitti. Faz 3'te ORG_ADMIN'in de kendi org'undaki kullanıcıyı güncelleyebilmesi gerekiyordu. En basit çözüm seçildi: **tek controller, tek route, role bazlı dallanan tek servis metodu** (`@Roles(SUPER_ADMIN, ORG_ADMIN)` + `UsersService.update` içinde `currentUser.role === SUPER_ADMIN ? {id} : {id, organizationId}` where koşulu). Ayrı route/controller açmak (`/team/users/:id` gibi) gereksiz bir soyutlama olurdu.

## 5. Property modeli ve filtre DTO'su
- Tek düz `Property` tablosu, tüm tipe özgü alanlar nullable (CLAUDE.md kuralı — polimorfizm/JSON blob yok). Enum'lar: `PropertyType`, `ListingType`, `PropertyStatus`.
- `PropertyFilterDto` (`apps/api/src/properties/dto/property-filter.dto.ts`) `PaginationQueryDto`'yu extend ediyor ve ayrı bir dosyada — Faz 4'teki harita marker endpoint'i aynı DTO'yu (`q`, `propertyType`, `listingType`, `status`, `city`, `district`, `minPrice`, `maxPrice`) kullanacak.
- `price`/`monthlyFee` Prisma `Decimal` — JSON'a serileşirken **string** olarak gelir (`Decimal.toJSON()`); frontend tarafında `Number(property.price)` ile çevriliyor (bkz. `features/properties/types.ts`, `PropertiesPage.tsx`).

## 6. LocationPicker (`apps/web/src/components/map/LocationPicker.tsx`) — Faz 4'te MapView ile paylaşılacak parçalar
- Leaflet marker ikonlarının Vite'ta kaybolma sorunu, ikonları elle import edip `L.icon(...)`'a set ederek çözüldü — bu pattern `MapView`/`PropertyMarker` için de aynen kullanılabilir.
- Varsayılan merkez (Konya, 37.87/32.49) ve zoom (12) sabitleri component içinde; Faz 4'te ortak bir `lib/constants.ts`'e çıkarılabilir (şimdilik tek kullanım yeri olduğu için erken soyutlama yapılmadı).
- Tıklama (`useMapEvents`) ve sürükleme (`marker eventHandlers.dragend`) ile pin güncelleniyor; `RecenterOnValue` component'i yalnızca mount'ta (edit modunda mevcut pine odaklanmak için) `map.setView` çağırıyor — bu yüzden `PropertyFormPage` formu, veri gelene kadar (edit modunda) render etmiyor.
- Faz 4'teki `MapView`/`PropertyMarker` bu component'in "tıkla → pin" mantığını değil, "listeden gelen coğrafi noktaları göster" mantığını kullanacak; ortak olan yalnızca ikon fix'i ve temel `MapContainer`/`TileLayer` kurulumu.

## 7. Zod + react-hook-form + coerce alanları — dikkat edilmesi gereken nokta
`z.coerce.number()` kullanılan alanlarda (`price`, `grossM2` vb.) zod'un "input" tipi (parse öncesi, RHF'nin gördüğü) ile "output" tipi (parse sonrası, submit handler'ın aldığı) farklı. Bu yüzden `PropertyFormInput` (`z.input<typeof propertySchema>`) ve `PropertyFormValues` (`z.output<typeof propertySchema>`) ayrı export edildi; `useForm<PropertyFormInput, unknown, PropertyFormValues>` ile RHF'ye iki tip birden veriliyor (bkz. `features/properties/schema.ts`, `PropertyForm.tsx`). Ayrıca boş bırakılan optional number input'ları RHF'den `''` olarak gelip `z.coerce.number()` tarafından `0`'a çevrilip `.positive()` gibi kuralları kırıyordu — `optionalNumber()` helper'ı `''`/`null`'ı `undefined`'a çeviren bir `z.preprocess` sarmalıyor. Playwright ile uçtan uca test edilirken ortaya çıktı; benzer bir optional+coerce alan eklenirse aynı helper kullanılmalı.

## 8. components/ui/ primitive'leri (apps/web/src/components/ui/)
`Button`, `Input`, `Select`, `Badge`, `Modal`, `ConfirmDialog`, `Table` — küçük, prop-driven, Tailwind. Faz 3'te değişiklik yapılmadı, olduğu gibi yeniden kullanıldı (Team sayfası admin panelindeki kullanıcı tablosu deseninin birebir aynısı, `features/org-users/` altında).

## 9. Önemli kararlar / sapmalar
- **Prisma 6'ya sabitlendi** (`prisma@6`, `@prisma/client@6`) — Prisma 7 driver-adapter zorunluluğu CLAUDE.md sadelik ilkesiyle çakışıyordu.
- **Postgres host portu 5433** (`docker-compose.yml`, `.env`) — makinede zaten çalışan native Postgres 5432'yi tutuyordu; container-içi iletişim `postgres:5432` etkilenmedi.
- Seed kullanıcıları (hepsi şifre `Password123!`): `superadmin@emlakpanel.dev` (SUPER_ADMIN), `admin@konyaemlak.dev`/`agent@konyaemlak.dev` (Konya Emlak Ofisi, 7 demo taşınmaz), `admin@istanbulemlak.dev`/`agent@istanbulemlak.dev` (İstanbul Emlak Ofisi, 8 demo taşınmaz). Seed idempotent (upsert).
- Passport kullanılmadı; sade `@nestjs/jwt` + custom guard'lar.
- **Docker container'ın node_modules'ü ayrı bir volume** (`/app/node_modules`, host'tan izole) — host'ta `npx prisma generate` çalıştırmak container içindeki Prisma Client'ı güncellemiyor; şema değişikliğinden sonra `docker exec <api-container> npx prisma generate` (veya container restart + generate) gerekiyor.
- Update-DTO'lar için `@nestjs/mapped-types`/`PartialType` kullanılmadı (yeni bağımlılık eklememek için) — `UpdatePropertyDto` alanları elle optional yazıldı.

## 10. Frontend dosya haritası (Faz 3'te eklenenler)
- `features/properties/`: `types.ts`, `api.ts`, `hooks.ts` (`useProperties`, `useProperty`, `useCreateProperty`, `useUpdateProperty`, `useDeleteProperty`), `schema.ts` (zod + `fieldsForType`/`stripIrrelevantFields`), `components/PropertyForm.tsx`.
- `features/org-users/`: aynı desende `types.ts`/`api.ts`/`hooks.ts`/`schema.ts`, `components/CreateOrgUserModal.tsx`, `components/ResetOrgUserPasswordModal.tsx` — admin panelindeki eşdeğerlerinin org-scoped kopyası (kasıtlı, `features/admin/` SUPER_ADMIN'e özel kalsın diye ayrıldı).
- `pages/`: `PropertiesPage.tsx` (`/`), `PropertyFormPage.tsx` (`/properties/new`, `/properties/:id/edit`), `TeamPage.tsx` (`/team`). `DashboardPage.tsx` silindi (yerini `PropertiesPage` aldı).
- `components/layout/AppLayout.tsx`: eski ad-hoc dashboard header'ının yerine geçen gerçek app layout (nav: Portföy, Ekip yalnızca ORG_ADMIN'e görünür).
- `components/map/LocationPicker.tsx`: bkz. §6.
- Yeni locale dosyaları: `locales/tr/properties.json`, `locales/tr/team.json`; `lib/i18n.ts`'e eklendi. `common.json`'a `nav.properties`/`nav.team` eklendi.
- `api/client.ts`: `apiFetch` artık `204 No Content`'i (`DELETE /properties/:id`) `undefined` dönerek ele alıyor — önceden her zaman `response.json()` çağırıp boş body'de patlıyordu.

## 11. Ortam durumu (Faz 4 sonunda)
- `docker-compose up -d` çalışır durumda bırakıldı (postgres + api container'ları ayakta, şema değişikliği olmadığı için `prisma generate` gerekmedi).
- `apps/web` dev server (`npm run dev`) Playwright doğrulaması sonrası **durduruldu** — sonraki oturumda yeniden başlatmak gerekir.
- Seed verisi temiz durumda: Konya 7, İstanbul 8 taşınmaz (Playwright golden-path doğrulaması sırasında yalnızca gezinme/filtre/seçim yapıldı, kayıt oluşturma/silme denenmedi; e2e testinin oluşturduğu geçici kayıtlar `afterAll`'da otomatik temizlendi).

## 12. Bilinen açık işler
- Faz 2'den devreden i18n hata anahtarı namespace çakışması düzeltildi (`auth/schema.ts`'deki `'auth.errors.xxx'` → `'errors.xxx'`).
- Faz 5 planlanmadı: fotoğraf galerisi (Cloudinary). `PropertyDetailPage`'de yer tutucu yorum (`{/* Fotoğraflar — Faz 5 */}`) bırakıldı, görünür bir UI/empty-state eklenmedi (bilinçli — spec'in isteği buydu).

## 13. Faz 4 — Ana ekran (harita + liste), detay sayfası, mobil

### Backend: `GET /properties/map-markers`
- `PropertiesController` (`apps/api/src/properties/properties.controller.ts`): `@Roles(ORG_ADMIN, AGENT)` (sınıf seviyesindeki guard'tan miras), route **`:id`'den ÖNCE** tanımlı — aksi halde Nest `map-markers`'ı bir id sanıp `findOne`'a yönlendirir.
- `PropertiesService.findMapMarkers()`: `findAll` ile aynı filtreleri (`PropertyFilterDto`, aynen Faz 3'te öngörüldüğü gibi) kullanır ama pagination YOK, `select` ile hafif shape döner (`id, title, propertyType, listingType, status, price, currency, latitude, longitude, district`). Filtre-to-where çevirisi `buildFilterWhere()` private helper'ına çıkarıldı, hem `findAll` hem `findMapMarkers` bunu kullanıyor (tekrar yok).
- e2e: `apps/api/test/properties-map.e2e-spec.ts` — tenant izolasyonu, SUPER_ADMIN 403, filtrelerin (status/q/price) marker sonucuna uygulanması, pagination meta'sının olmadığının doğrulanması.

### Frontend: paylaşılan harita altyapısı
- `lib/mapConstants.ts` (KONYA_CENTER, DEFAULT_ZOOM, TILE_URL, TILE_ATTRIBUTION) ve `lib/leafletIcons.ts` (defaultIcon) yeni eklendi; `LocationPicker` bunları kullanacak şekilde refactor edildi (kopya kod kalmadı).
- `components/map/MapView.tsx`: çoklu marker'lı harita. Marker'lar Leaflet'in varsayılan pin'i yerine renk/durum'a göre ayrışan basit bir `L.divIcon` damla ile çiziliyor (ACTIVE=yeşil, SOLD/RENTED=gri, PASSIVE=kırmızı-soluk, seçili=turuncu+büyük) — ekstra asset gerekmiyor.
  - **Önemli bug + çözüm**: Mobilde harita sekmesi başlangıçta `display:none` iken mount olduğundan Leaflet 0x0 boyutla ilk pixel-origin hesabını yapıyor; sekme açılınca yalnızca `invalidateSize()` çağırmak marker konumlarını düzeltmeye YETMİYOR (bounds sıfır boyutla hesaplanmış oluyor, marker'lar viewport dışına düşüyor). Çözüm: `MapSizeAndBounds` component'i `ResizeObserver` ile container boyut değişimini izliyor, her değişimde `invalidateSize()` + `fitBounds()`'u BİRLİKTE tetikliyor (yalnızca ilk görünürlükte değil, pencere resize'ında da). Benzer bir "gizliyken mount olan harita" pattern'i tekrar kullanılırsa bu component örnek alınmalı.
- `components/map/StaticLocationMap.tsx`: detay sayfasındaki salt-okunur küçük harita (tüm interaksiyonlar kapalı: dragging/scrollWheelZoom/zoomControl vb. false).

### Frontend: ana ekran (`/`) — `pages/PropertiesPage.tsx`
- Filtre state'i `useSearchParams` ile URL'de tutuluyor (`q, propertyType, listingType, status, minPrice, maxPrice, page`); hem `useProperties` (liste, paginated) hem `usePropertyMarkers` (harita, tüm sonuçlar) aynı filtre objesini kullanıyor — liste ve harita her zaman senkron.
- `AppLayout`'a yeni `fullBleed?: boolean` prop'u eklendi: `true` olduğunda dış container `h-screen overflow-hidden` (diğer sayfalarda `min-h-screen`), `main` `flex-1 min-h-0 overflow-hidden` oluyor. **Önemli bug + çözüm**: İlk denemede dış container yalnızca `min-h-screen` idi — bu bir *minimum*, flexbox'a kesin bir yükseklik vermiyor, dolayısıyla `flex-1`in dağıtacağı "kalan alan" tanımsız kalıyor ve sayfa içeriğin doğal yüksekliği kadar büyüyordu (liste+harita üst üste biniyordu, marker tıklamaları filtre input'una gidiyordu). Kesin `h-screen` şart.
- Masaüstü: sol ~%58 harita + sağ ~%42 liste (kompakt kart satırları, `Table` primitive'i KULLANILMADI — dar panelde tablo yerine kart daha okunur; her satır tıklanınca seçim + harita pan/zoom, Düzenle/Sil satır içinde `stopPropagation` ile).
- Seçim: `selectedId` local state, marker/satır tıklamasıyla set edilir; `PropertySummaryCard` (yeni, `features/properties/components/`) hem masaüstü overlay hem mobil bottom-sheet için AYNI component (konumlandırma dıştan verilir).
- Mobil: `mobileView` local state (`'map' | 'list'`, varsayılan `'list'`), altta sabit toggle bar; filtre çubuğu mobilde `Modal` içinde aynı `PropertyFilterBar`.
- Viewport-liste senkronu bilinçli olarak YOK (haritayı kaydırmak listeyi filtrelemez).
- `features/properties/format.ts` (yeni): `formatPrice`/`statusTone` üç yerde (liste satırı, özet kart, detay sayfası) tekrarlanmasın diye çıkarıldı.

### Frontend: detay sayfası (`/properties/:id`) — `pages/PropertyDetailPage.tsx`
- Bölümler: üstte badge'ler+başlık+fiyat+Düzenle/Sil, temel bilgiler + tipe özgü alanlar (boş olanlar `&& (...)` ile gizli), açıklama, mal sahibi bloğu (amber arka planlı, "ofis içi bilgi" vurgusu), sağda `StaticLocationMap` + adres metni. Fotoğraf bölümü bilinçli olarak render edilmiyor (bkz. §12).
- Route: `App.tsx`'te `/properties/:id` eklendi (`/properties/new` ve `/properties/:id/edit`'ten SONRA tanımlansa da react-router v7 static/dynamic path ranking'i nedeniyle sıra sorun değil).

### i18n
- `locales/tr/properties.json`'a `map.*` (filters/summary/mobile/pagination/empty) ve `detail.*` (sections/ownerBlockTitle/yes/no/loading) namespace'leri eklendi.
