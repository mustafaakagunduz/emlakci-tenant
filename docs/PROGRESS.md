# EmlakPanel — İlerleme Durumu

## 1. Tamamlanan fazlar
- **Faz 0**: Proje iskeleti (apps/api NestJS, apps/web Vite+React, Docker Compose) — tam.
- **Faz 1**: Auth + multi-tenancy çekirdeği (login, guard'lar, TenantContext, seed, testler) — tam, browser-doğrulanmış.
- **Faz 2**: Super Admin paneli (org/user CRUD, org pasifleştirme kilidi, admin UI) — tam, 20/20 backend testi geçiyor, browser-doğrulanmış.
- **Faz 3**: Property CRUD + org içi kullanıcı yönetimi — tam, 33/33 e2e testi geçiyor (app 1 + auth 8 + organizations 7 + properties 11 + users 6 = 33), browser-doğrulanmış (Playwright ile golden path).
- **Faz 4**: Ana ekran (harita + liste), taşınmaz detay sayfası, mobil responsive — tam, 39/39 e2e testi geçiyor (Faz 3'teki 33 + yeni properties-map 6), browser-doğrulanmış (Playwright ile masaüstü + ~390px mobil golden path, tenant izolasyonu görsel olarak da doğrulandı).
- **Faz 5**: Fotoğraflar (Cloudinary, backend imzalı direct upload) — tam, 50/50 e2e testi geçiyor (Faz 4'teki 39 + yeni properties-photos 11), **gerçek bir Cloudinary hesabıyla uçtan uca browser-doğrulanmış**: 3 fotoğraf yüklendi (ilerleme yüzdesi çalıştı), kapak değiştirildi, biri silindi (Cloudinary'den de gerçekten kalktı), detay sayfasında galeri + kendi lightbox'ımız (ok tuşları/kapatma) çalıştı, liste satırı + harita özet kartında gerçek kapak thumbnail'i göründü. Test verisi ve Cloudinary asset'leri doğrulama sonrası temizlendi (bkz. §11/§14).
- **Faz 6**: Taşınmaz formunda akıllı, iki yönlü konum seçimi (il/ilçe/mahalle autocomplete ↔ harita) — tam, 57/57 e2e testi geçiyor (Faz 5'teki 50 + yeni geo 7) + 8 backend unit testi (`nominatim.service.spec.ts` + mevcut `tenant-context.spec.ts`). **Backend `tsc --noEmit`/`nest build` ve frontend `tsc -b`/`vite build` sıfır hata.** 973 ilçenin tamamı için koordinat çekildi (0 hata). **Gerçek tarayıcıda (Playwright, bu oturumda scratchpad'e geçici kurulan bir script ile) golden path uçtan uca doğrulandı**: "ank" yaz → Ankara öner/seç → harita Ankara'ya sonra Çankaya seçilince oraya uçtu (ekran görüntüleriyle doğrulandı) → haritaya tıkla → pin kondu + il/ilçe alanları otomatik doldu (mahalle bu spesifik merkez noktada Nominatim'den boş geldi — beklenen edge case, kullanıcı elle tamamlar) → kayıt başarıyla oluşturuldu, düzenleme sayfasında tüm konum verisi doğru göründü. Test kayıtları doğrulama sonrası soft-delete ile temizlendi.

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
- `GET /properties/map-markers` — `@Roles(ORG_ADMIN, AGENT)`, pagination'sız hafif marker listesi (Faz 4)
- `POST /properties/:id/photos/signature`, `POST /properties/:id/photos` — `@Roles(ORG_ADMIN, AGENT)`, Cloudinary imza + metadata kaydı (Faz 5)
- `PATCH /photos/:photoId/cover`, `DELETE /photos/:photoId` — `@Roles(ORG_ADMIN, AGENT)` (Faz 5)
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

## 11. Ortam durumu (Faz 5 sonunda)
- `docker-compose up -d` çalışır durumda bırakıldı. **Önemli**: `cloudinary` paketi Faz 5'te eklendi — host'ta `npm install` yeterliydi ama container'ın izole `node_modules` volume'üne girmesi için `docker exec emlakci-tenant-api-1 npm install cloudinary` + ardından **container restart** gerekti (bkz. §14, "node_modules volume + yeni bağımlılık" notu — bu, PROGRESS.md §9'daki "host'ta prisma generate container'ı güncellemiyor" sorunundan FARKLI bir varyant: burada dosya değişikliği değil, yepyeni bir paket ekleniyor).
- `apps/web` dev server (`npm run dev`) Playwright doğrulaması sonrası **durduruldu**.
- Seed verisi temiz durumda: Konya 7, İstanbul 8 taşınmaz, hiçbirinde fotoğraf yok. Faz 5 doğrulaması için oluşturulan geçici test taşınmazı ve 2 test fotoğrafı, hem Cloudinary'den (gerçek `destroy` çağrısıyla) hem DB'den (hard delete) temizlendi.
- `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` artık **dolu** (`.env`, git'e gitmiyor). Kullanıcı **iki ayrı Cloudinary hesabı** ayırdı: biri production için (o hesabın bilgileri bu repoya hiç yazılmadı — henüz `docker-compose.prod.yml`/prod deploy'u da yok; o faza gelindiğinde production sunucusunun kendi ortamına ayrıca girilecek), diğeri **yalnızca lokal/staging geliştirme** için — `apps/api/.env`'e yazılan ve şu an kullanılan hesap bu ikincisi. Gerçek uçtan uca yükleme/kapak/silme/galeri akışı bu lokal/staging hesabıyla doğrulandı (bkz. §14), ayrıca doğrudan Cloudinary'ye ham bir upload isteğiyle de hesabın gerçekten çalıştığı teyit edildi (test asset'i sonrasında `destroy` ile temizlendi). **Önemli**: `.env` içeriği değişince `docker-compose restart api` YETMEZ — env değişkenleri container OLUŞTURULURKEN enjekte edilir, salt restart yeniden okumaz. `docker-compose up -d --force-recreate api` gerekir.

## 12. Bilinen açık işler
- Faz 2'den devreden i18n hata anahtarı namespace çakışması düzeltildi (`auth/schema.ts`'deki `'auth.errors.xxx'` → `'errors.xxx'`).
- Faz 6 planlanmadı. Faz 5'te bilinçli olarak yapılmayan: fotoğraf sürükle-bırak yeniden sıralama (yalnızca kapak seçimi var, sortOrder upload sırasına göre otomatik).

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
- Bölümler: üstte badge'ler+başlık+fiyat+Düzenle/Sil, temel bilgiler + tipe özgü alanlar (boş olanlar `&& (...)` ile gizli), açıklama, mal sahibi bloğu (amber arka planlı, "ofis içi bilgi" vurgusu), sağda `StaticLocationMap` + adres metni. Faz 4 sonunda fotoğraf bölümü bilinçli olarak render edilmiyordu (yalnızca `{/* Fotoğraflar — Faz 5 */}` yorumu vardı); **Faz 5'te gerçek galeri + `PhotoLightbox` ile dolduruldu** (bkz. §14).
- Route: `App.tsx`'te `/properties/:id` eklendi (`/properties/new` ve `/properties/:id/edit`'ten SONRA tanımlansa da react-router v7 static/dynamic path ranking'i nedeniyle sıra sorun değil).

### i18n
- `locales/tr/properties.json`'a `map.*` (filters/summary/mobile/pagination/empty) ve `detail.*` (sections/ownerBlockTitle/yes/no/loading) namespace'leri eklendi.

## 14. Faz 5 — Fotoğraflar (Cloudinary, backend imzalı direct upload)

### Model
- `PropertyPhoto` modeli ve `Property.photos` ilişkisi aslında **Faz 3'te zaten şemaya ve migration'a eklenmişti** (`prisma/schema.prisma`, migration `20260705220609_add_property_model`) — Faz 5'te yeni migration GEREKMEDİ, doğrudan servis/controller katmanı yazıldı.

### Backend: endpoint'ler ve mimari
- `apps/api/src/photos/` yeni modül: `cloudinary.service.ts`, `photos.service.ts`, `property-photos.controller.ts` (`/properties/:propertyId/photos*`), `photos.controller.ts` (`/photos/:photoId*`), `dto/create-photo.dto.ts`, `photos.module.ts`.
- `CloudinaryService`: `cloudinary` npm paketini (`v2`) tek noktadan sarar — `createSignature(params)` ve `destroy(publicId)`. Env (`CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`) boşsa `configured=false` olur, her iki metod da çağrılınca **503 `ServiceUnavailableException`** fırlatır — uygulama yine ayağa kalkar, yalnızca photo endpoint'leri anlaşılır şekilde kapalı kalır.
- `PhotosService`: `PropertiesService.findOne()`'ı **enjekte edip reuse ediyor** (tenant izolasyonu + soft-delete kontrolü propertyId bazlı işlemlerde tekrar yazılmadı) — bunun için `PropertiesModule`'e `exports: [PropertiesService]` eklendi, `PhotosModule` onu import ediyor. photoId bazlı işlemlerde (kapak/sil) ise `prisma.propertyPhoto.findFirst({ where: { id: photoId, property: tenant.scopeWhere({deletedAt:null}) } })` ile nested-relation üzerinden tek sorguda tenant kontrolü yapılıyor.
- Endpoint'ler: `POST /properties/:id/photos/signature` (imza; folder deseni `emlakpanel/{organizationId}/{propertyId}`, 20 foto limiti burada da kontrol edilir), `POST /properties/:id/photos` (publicId'nin folder önekiyle eşleştiği doğrulanır, ilk foto otomatik kapak), `PATCH /photos/:photoId/cover` (transaction: eskisi false, yenisi true), `DELETE /photos/:photoId` (Cloudinary destroy + hard delete; silinen kapaksa `sortOrder asc, createdAt asc` sıralı en eski foto otomatik kapak olur).
- `PropertiesService.findOne` artık `include: { photos: {orderBy: [sortOrder,createdAt]} }` ile tam foto dizisini döner; `findAll`/`findMapMarkers` ise yalnızca `coverPhotoUrl` (kapak fotoğrafın URL'i, `include`/`select` + map ile üretilir) döner — tam `photos` dizisi listede/harita marker'ında YOK (spec'in isteği, payload küçük kalsın diye).

### `node_modules` volume + yeni bağımlılık eklerken dikkat (Faz 5'te ortaya çıkan yeni bir gotcha)
- PROGRESS.md §9'daki not ("host'ta prisma generate container'ı güncellemiyor") burada YETMEDİ: **yeni bir npm paketi** (`cloudinary`) eklerken host'ta `npm install` + `docker exec ... npm install` yapmak container'ın node_modules volume'üne paketi koydu ama ts-node/webpack watch süreci **yeni oluşturulan `src/photos/` klasörünü** (bind-mount üzerinden host'tan gelen yeni dosyalar) algılamadı — muhtemelen colima VM'inin bind-mount'ta inotify event'lerini düzgün iletmemesinden. Çözüm: **container'ı restart etmek** (`docker-compose restart api`) watch'ın sıfırdan tam bir directory scan yapmasını sağladı ve yeni controller'lar/route'lar doğru yüklendi. Benzer bir durumda (yeni bir üst-düzey modül/klasör eklenip route'ların loglanmadığı görülürse) önce container restart denenmeli.

### Frontend: paylaşılan altyapı
- `lib/cloudinary.ts`: `cloudinaryUrl(url, {w,h})` — Cloudinary `secure_url`'inin `/upload/` segmentinden hemen sonra `f_auto,q_auto[,w_X,h_Y,c_fill]` transformation'ı ekler. Ham büyük görsel hiçbir yerde (liste/kart/detay/manager) doğrudan render edilmiyor, hepsi bu helper'dan geçiyor.
- `features/properties/photoUpload.ts`: `uploadPropertyPhoto(propertyId, file, onProgress)` — 3 adımı birleştiren orkestrasyon: backend'den imza al (`fetchPhotoSignature`) → `XMLHttpRequest` ile doğrudan Cloudinary'ye yükle (`xhr.upload.onprogress` ile yüzde takibi — `fetch`'te bu yok) → backend'e metadata kaydet (`createPropertyPhoto`). Dosya backend'den hiç geçmiyor.
- `features/properties/components/PropertyThumbnail.tsx`: liste satırı + özet kart + (gerekirse ileride) başka yerlerde ortak kullanılan thumbnail; `url` yoksa basit bir SVG placeholder (ikon), üç yerde tekrarlanmasın diye çıkarıldı.
- `features/properties/components/PhotoLightbox.tsx`: kütüphane kullanılmadan yazılmış basit lightbox — ok tuşları (klavye + buton) ile gezinme, Escape ile kapama, tıklamayla arka plana kapanma.
- `features/properties/components/PhotoManager.tsx`: düzenleme sayfasında kullanılan tam CRUD galeri — çoklu dosya seçimi, dosya başına ilerleme durumu (`uploading` yüzdesi veya hata mesajı; 10MB/MIME kontrolü client'ta), kapak yap/sil aksiyonları (hover'da görünür), sil için `ConfirmDialog`.

### Tasarım kararı: PhotoManager nerede, salt-okunur galeri nerede
- Spec'te "PhotoManager düzenleme sayfasına ve detay sayfasına eklenir" ifadesi belirsizdi (detay sayfası için ayrıca "kapak büyük, grid, lightbox" tarif ediliyordu — bu, upload/sil aksiyonlu bir yönetim UI'sinden farklı bir şey). **Karar**: PhotoManager (upload/kapak/sil) yalnızca **düzenleme sayfasında**; detay sayfasında salt-okunur bir galeri (grid + tıklayınca `PhotoLightbox`) var, yönetim aksiyonu yok — detay sayfasının zaten "Düzenle" butonu bu ihtiyacı karşılıyor. CLAUDE.md'nin "belirsizse en basit + tutarlı olanı seç, kararı not et" ilkesine göre bu şekilde ilerlendi.

### Frontend: create → edit akışı ve fotoğraf ipucu
- `PropertyFormPage.tsx`: taşınmaz **oluşturma** başarılı olunca artık `/` yerine `/properties/:id/edit`'e yönlendiriyor (`navigate(..., { state: { justCreated: true } })`), çünkü fotoğraf yüklemek propertyId gerektiriyor (Cloudinary folder deseni `.../propertyId/...`). Bu sayfa `useLocation().state.justCreated` doğruysa mavi bir bilgi kutusu ("Taşınmaz oluşturuldu. Şimdi fotoğraf ekleyebilirsiniz.") gösteriyor. **Güncelleme** (edit) akışı değişmedi, hâlâ `/`'e döner.
- `PhotoManager`, `PropertyFormPage`'de yalnızca `isEdit && property` durumunda (property zaten var, propertyId elde) render ediliyor — create formunun altında YOK.

### Test kapsamı
- `apps/api/test/properties-photos.e2e-spec.ts`: `CloudinaryService`'i `overrideProvider` ile mock'layan tam fonksiyonel test — tenant izolasyonu (başka org'un property'sine imza/foto isteği → 404), yanlış folder önekli publicId → 400, 20 foto limiti (hem imza hem create için → 400), ilk fotonun otomatik kapak olması, kapak değiştirmenin tek-kapak kuralını koruması, başka org'un fotoğrafına erişimin 404 vermesi, kapak fotoğraf silinince otomatik devir.
- Toplam: 50/50 (Faz 4'teki 39 + yeni 11; `properties-map.e2e-spec.ts`'teki marker shape testi `coverPhotoUrl` alanını da bekleyecek şekilde güncellendi).
- ~~`apps/api/test/properties-photos-unconfigured.e2e-spec.ts`~~: Cloudinary env'i doldurulmadan önce yazılmış, CloudinaryService'i mock'lamayan bir 503-doğrulama testiydi. Kullanıcı gerçek Cloudinary bilgilerini sağladıktan sonra bu ortamdaki senaryoyu artık temsil etmediği için **silindi** (PROGRESS.md'deki kendi notunda öngörüldüğü gibi).
- Browser (Playwright) ile **gerçek bir Cloudinary hesabıyla** doğrulanan tam akış: taze bir taşınmaza 3 fotoğraf yüklendi (ilerleme yüzdesi göründü), kapak fotoğraf değiştirildi (tek-kapak kuralı UI'da da doğru yansıdı), bir fotoğraf silindi (Cloudinary'den gerçekten kalktı, DELETE isteğiyle doğrulandı), detay sayfasında galeri + `PhotoLightbox` (ok tuşları, sonraki/önceki, kapatma) çalıştı, liste satırı ve harita özet kartında gerçek kapak thumbnail'i (`cloudinaryUrl` transform'uyla) göründü. Doğrulama sonrası test taşınmazı ve fotoğrafları hem Cloudinary'den hem DB'den temizlendi.
- Ayrıca (Cloudinary gerektirmeyen, önceden doğrulanmış) senaryolar hâlâ geçerli: fotoğrafsız kayıtların liste/detay/özet kartında düzgün göründüğü (placeholder ikon), create→edit yönlendirmesi + ipucu banner'ı.

## 15. Faz 6 — Taşınmaz formunda akıllı, iki yönlü konum seçimi

### Veri seti: kaynak, lisans, vendoring
- İl/ilçe/mahalle listesi [TurkiyeAPI](https://github.com/ubeydeozdmr/turkiye-api) projesinin 2025 statik veri setinden (`https://api.turkiyeapi.dev/v2/datasets/2025/{provinces,districts,neighborhoods}.json`, **MIT lisanslı**) türetildi, sadeleştirilip `apps/api/src/geo/data/{provinces,districts,neighborhoods}.json` altına vendor'landı (kaynak/lisans notu `apps/api/src/geo/data/README.md`'de).
- 81 il (`id, name, lat, lng`), 973 ilçe (`id, name, provinceId, lat, lng`), ~32.254 mahalle (`id, name, provinceId, districtId` — koordinat yok, gerekmiyor).
- İlçe koordinatları kaynak sette yoktu; `apps/api/scripts/fetch-district-coords.js` betiği ile Nominatim'den (1.1 sn/istek, ~973 istek ≈ 18 dk) tek seferlik çekilip `districts.json`'a yazıldı ve commit'lendi — **çalışan uygulama ilçe koordinatı için asla Nominatim'e gitmez**.
- Mahalle listesi (~2MB JSON) yalnızca backend'den `/geo/neighborhoods` ile sunulur, frontend bundle'ına hiç gömülmez.
- **Plate kodu tesadüfü**: TurkiyeAPI'nin il `id`'leri 1–81, Türkiye'nin resmi il plaka kodlarıyla birebir aynı sırada (`id:1`→Adana→"01" vb.) — bu yüzden `code` alanı ayrı bir kaynağa gitmeden `String(id).padStart(2,'0')` ile üretildi.

### Backend: `apps/api/src/geo/`
- `geo.service.ts`: JSON dosyalarını `readFileSync` ile bir kez (constructor'da) belleğe yükler, `provinceId`/`districtId` bazlı `Map` index'leri kurar — DB tablosu/migration YOK. `geo.util.ts`'teki `normalizeTurkish()` (İ/ı/ş/ğ/ü/ö/ç normalize + case-fold) ile hem filtreleme hem reverse-geocode eşleştirmesi Türkçe karakter/case duyarsız çalışır.
- `nominatim.service.ts`: Nominatim reverse endpoint'ini sarar, koordinatı ~4 ondalığa yuvarlayıp `Map` tabanlı bellek-içi cache tutar (aynı noktaya ikinci çağrı Nominatim'e gitmez — `nominatim.service.spec.ts` ile unit test edildi). Hata/timeout'ta (5sn `AbortSignal.timeout`) exception fırlatmaz, `{province:undefined,...}` döner — controller bunu `null`'a çevirip form akışını kesmez.
- Endpoint'ler (`geo.controller.ts`, sadece login yeterli — `@Roles` yok): `GET /geo/provinces?q=`, `GET /geo/districts?province=&q=`, `GET /geo/neighborhoods?province=&district=&q=` (max 20 sonuç), `GET /geo/reverse?lat=&lng=`.
- **Query param'ların number'a çevrilmesi**: `ReverseGeocodeQueryDto`'daki `@Type(() => Number)` + global `ValidationPipe({transform:true})` beklenenin aksine `query.lat`'i otomatik number'a çevirmedi (e2e testte string olarak geldiği görüldü) — controller'da `Number(query.lat)` ile açıkça çevrilerek çözüldü, DTO yine de giriş validasyonu (`@IsLatitude`) için kalıyor.
- **nest-cli asset kopyalama gotcha'sı**: `nest-cli.json`'a `"assets": [{"include": "geo/data/*.json", "outDir": "dist/src"}]` eklendi. Düz `"assets": ["geo/data/*.json"]` ile veri dosyaları `dist/geo/data/`'ya kopyalanıyordu ama derlenen `geo.service.js` `dist/src/geo/`'da yaşıyor (tsconfig'te `rootDir` sınırlanmadığı için tsc çıktısı `src/` önekini koruyor) — `__dirname` bazlı okuma `ENOENT` veriyordu. `outDir: "dist/src"` asset hedefini derlenmiş kodla aynı hizaya getirdi.
- **Bulunan ayrı bir ortam sorunu (bu görevle ilgisiz ama engelleyiciydi)**: `emlakci-tenant-api-1` container'ı repo `emlak-panel/` alt klasörüne taşınmadan ÖNCE oluşturulmuştu; bind mount hâlâ eski (artık var olmayan) yola işaret ediyordu, `docker-compose restart api` bu yüzden `/app/package.json` ENOENT ile patlıyordu. `docker-compose up -d --force-recreate api` container'ı doğru bind mount ile yeniden yarattı — benzer bir "restart sonrası /app boş/ENOENT" görülürse önce `docker inspect <container> --format '{{json .Mounts}}'` ile bind mount kaynağının güncel repo yoluyla eşleştiği kontrol edilmeli.
- Env: `NOMINATIM_USER_AGENT` (`.env`, `.env.example`) — Nominatim politikası tanımlayıcı User-Agent istiyor.

### Frontend: `Combobox` primitive'i (`components/ui/Combobox.tsx`)
- Harici kütüphane yok; klavye navigasyonu (yukarı/aşağı/enter/escape), dışa tıklayınca kapanma (`document mousedown` + ref), "sonuç yok"/"yükleniyor" durumları. `value`/`onChange` (her tuş vuruşunda) + `onSelectOption` (yalnızca bir öneri seçilince) ayrı prop'lar — bu ayrım, aşağıdaki döngü korumasının temeli.

### Frontend: `features/geo/` (api.ts + hooks.ts) ve form entegrasyonu
- `useProvinces(q)`/`useDistricts(province,q)`/`useNeighborhoods(province,district,q)` TanStack Query ile (`staleTime: Infinity` — sabit veri, tekrar tekrar fetch gereksiz); metin `lib/useDebouncedValue.ts` (250ms) ile debounce'lanıp query'e veriliyor.
- **Döngü koruması mimari kararı**: Faz 6 prompt'unun önerdiği "programatik güncelleme bayrağı" yerine daha basit bir çözüm seçildi — **iki yön hiçbir ortak reactive watch üzerinden birbirini tetiklemiyor, tamamen ayrı imperative handler'lar**:
  - *Alan→harita*: yalnızca `Combobox`'ın `onSelectOption` callback'i (`handleSelectProvince`/`handleSelectDistrict`, `PropertyForm.tsx`) `setValue(...)` + `setFlyTarget(...)` çağırır. Serbest yazı (`onChange`) hiçbir zaman haritayı hareket ettirmez veya alt alanları temizlemez.
  - *Harita→alan*: yalnızca `LocationPicker`'ın `onChange`'i (tıklama/sürükleme) `handleMapChange`'i tetikler; bu, pini hemen taşır ve 300ms debounce'lu `fetchReverseGeocode` çağrısıyla `setValue('city'/'district'/'neighborhood', ...)` yapar — `setFlyTarget` ÇAĞIRMAZ (harita zaten o noktada).
  - Aralarında "X değişti → Y'yi güncelle" tipinde bir `useEffect`/`watch` köprüsü YOK; bu yüzden klasik sonsuz döngü (alan→harita→reverse→alan→...) mimari olarak zaten imkânsız, ayrı bir "guard" flag'ine gerek kalmadı.
  - Üst alan seçilince alt alanların temizlenmesi de yalnızca **seçim commit'inde** oluyor (`handleSelectProvince` district+neighborhood'u sıfırlar), serbest yazarken değil — aksi halde her tuş vuruşunda ilçe/mahalle silinirdi.
- `LocationPicker.tsx`'e eklenen `flyTo?: {lat,lng,zoom}` prop'u yeni bir `FlyToController` component'i ile `map.flyTo(...)` çağırır (pin TAŞIMAZ); `isLocating`/`locatingLabel` prop'ları haritanın üstünde küçük bir "Konum bulunuyor…" rozeti gösterir.
- `addressText` (açık adres) hiçbir otomasyonda dokunulmuyor — hem spec gereği hem kod incelemesiyle doğrulandı (yalnızca `register('addressText')` ile bağlı, başka hiçbir handler'da referans yok).
- i18n: `locales/tr/properties.json` → `form.location.*` (placeholder'lar, boş/yükleniyor mesajları, harita ipucu).

### Test kapsamı
- `apps/api/test/geo.e2e-spec.ts`: auth olmadan 401, il/ilçe/mahalle filtreleme, bilinmeyen il için boş liste, reverse geocode'un yerel veriyle eşleştirilmesi, eşleşmeyen alanların `null` dönüp forma hata patlatmaması (`NominatimService` `overrideProvider` ile mock'landı).
- `apps/api/src/geo/nominatim.service.spec.ts`: gerçek cache davranışı (aynı koordinat → tek `fetch` çağrısı, farklı koordinat → iki çağrı) + hata/non-ok HTTP durumunda sessizce boş sonuç dönmesi, global `fetch` mock'lanarak unit seviyesinde doğrulandı.
- Toplam e2e: 58/58 (Faz 5'teki 50 + geo 8).
- **Browser doğrulaması**: Bu oturumda önceden kurulu bir MCP/Playwright aracı yoktu; `apps/web` node_modules'üne eklemeden, scratchpad'e geçici olarak `playwright` (npm) kurulup ad-hoc bir script ile gerçek Chromium'da golden path sürüldü (ekran görüntüleri incelendi): il yaz→Ankara seç→harita uçtu, ilçe yaz→Çankaya seç→yaklaştı, haritaya tıkla→pin kondu+il/ilçe alanları otomatik doldu, kayıt oluşturuldu→düzenleme sayfasında doğru değerler göründü. Test kayıtları temizlendi. **Yapılmayan**: pin sürükleme (drag) senaryosu ve mobil viewport'ta Combobox'ların katmanlanması (z-index/dropdown taşması) ayrıca doğrulanmadı — bir sonraki oturumda kontrol edilebilir.

### Ek: Sokak/Cadde alanı (harita tıklamasından otomatik doldurulan, opsiyonel, ayrı DB kolonu)
- `Property.street` (nullable `String?`) eklendi — migration `20260706213436_add_property_street`. Mahalle/il/ilçenin aksine yerel bir sokak veri seti YOK (vendor'lanmadı, boyutu pratik değil); bu alan tamamen Nominatim'in ham `address.road`/`address.pedestrian` alanından geliyor, yerel veriyle eşleştirilmiyor/doğrulanmıyor — sadece geçiş.
- `NominatimService.reverse()` artık `street` de dönüyor; `/geo/reverse` cevabına `street: string | null` eklendi.
- Frontend: `PropertyForm`'da düz bir `Input` (Combobox DEĞİL — öneri listesi yok, sadece haritadan otomatik dolan + serbestçe düzenlenebilen bir alan). `handleMapChange` artık `city`/`district`/`neighborhood` ile birlikte `street`'i de otomatik dolduruyor. Detay sayfasında varsa gösteriliyor (`property.street &&` koşullu).
- **Gotcha (tekrar karşılaşıldı)**: Sadece EXISTING dosyalara yapılan `geo.controller.ts`/DTO/`nominatim.service.ts` değişiklikleri bile `nest start --watch`'ın colima bind-mount'unda bazen algılanmıyor (yeni klasör olmasa da) — `docker-compose restart api` sonrası değişiklikler devreye girdi. Şema değişikliği olan her görevden sonra hem `prisma migrate dev` (host) + `docker exec <api> npx prisma generate` + container restart, hem de sıradan kod değişikliklerinde şüphe varsa bir restart denenmeli.
- Test: `nominatim.service.spec.ts` mock'una `road` eklendi, `geo.e2e-spec.ts`'teki reverse testlerine `street` assertion'ı eklendi (58 test, hepsi geçiyor). Gerçek tarayıcıda (Playwright, scratchpad) tekrar doğrulandı: haritaya tıklayınca "Sokak/Cadde" alanı da otomatik doldu ("Çankaya Caddesi"), kayıt sonrası doğru persist edildi.

### Ek: Mahalle/Sokak seçiminde harita da uçsun (alanlar → harita, il/ilçe ile simetrik)
- Sorun: il/ilçe Combobox'ından seçim yapınca harita `flyTo` ile o konuma gidiyordu (yerel veri setinde il/ilçe merkezinin lat/lng'i var), ama mahalle seçilince veya sokak yazılınca hiçbir şey olmuyordu — çünkü yerel veri setinde mahalle/sokak için koordinat YOK (`neighborhoods.json`'da hiç lat/lng alanı yok, vendor edilirken bilinçli olarak eklenmedi, bkz. bu dosyadaki önceki not).
- Çözüm: Nominatim'in **forward geocoding** (`/search`) endpoint'i backend'de yeni bir proxy ile sarıldı — `NominatimService.forward(query)` (`nominatim.service.ts`), sorgu metnini (`street, neighborhood, district, province, Türkiye`) `countrycodes=tr` ile arayıp ilk sonucun `lat`/`lon`'unu döner, sonuçlar bellekte cache'lenir. Yeni endpoint: `GET /geo/forward?province=&district=&neighborhood=&street=` (`geo.controller.ts`, DTO: `ForwardGeocodeQueryDto`).
- Frontend (`PropertyForm.tsx`): `handleSelectNeighborhood` artık Combobox'tan seçim yapılınca (`onSelectOption` — sadece kullanıcının bir seçenek tıklaması/Enter'ı tetikler, serbest yazma tetiklemez, il/ilçe ile aynı desen) `fetchForwardGeocode` çağırıp sonucu `flyTo` (zoom 16) ile haritaya uyguluyor. Sokak, Combobox değil düz bir `Input` olduğundan aynı `onSelectOption` deseni yok — bunun yerine alan **blur** olduğunda (`register('street', { onBlur: ... })`) forward geocode tetikleniyor (zoom 17, daha yakın). Blur seçildi çünkü haritadan otomatik dolan `street` değeri `setValue` ile yazılıyor ve gerçek bir DOM blur tetiklemiyor — bu yüzden harita→alan yönünün otomatik doldurduğu sokak, tekrar haritayı geri uçurup döngü oluşturmuyor (spec'teki döngü koruması prensibiyle tutarlı: iki yön tamamen ayrı, imperative event handler'lar).
- Test: `POST /auth/login` ile alınan token'la `curl "GET /geo/forward?..."` doğrudan denendi (mahalle ve sokak için gerçek koordinat döndü). `apps/api` `tsc --noEmit` ve `apps/web` `tsc -b` sıfır hatayla geçti, `test:e2e` 58/58 geçti (forward endpoint'e ayrı bir e2e testi eklenmedi — mevcut testler onu etkilemiyor, gerçek dış ağ çağrısı yaptığı için CI'da mock gerektirir; bu MVP kapsamında atlandı).
- **Browser doğrulaması (Playwright, scratchpad, ayrı script)**: il→Ankara, ilçe→Çankaya, mahalle→Kızılay seçimlerinin her biri haritayı doğru konuma uçurdu (ekran görüntüleriyle doğrulandı); ardından sokak alanına "Atatürk Bulvarı" yazılıp alandan çıkılınca harita daha da yakınlaşarak doğru caddeye gitti. Ayrıca mevcut harita→alan yönü (tıklayınca il/ilçe/mahalle otomatik dolması) regresyon olmadan çalışmaya devam ettiği ayrıca doğrulandı.

### Ek: Sokak/Cadde alanı da Combobox oldu (Overpass API ile gerçek sokak listesi)
- Kullanıcı isteği: il/ilçe/mahalle gibi sokak alanına tıklayınca da mahalledeki gerçek sokak/cadde listesi görünsün (adres standardizasyonu için). Önceki yaklaşım (serbest `Input` + blur'da forward-geocode) bunu karşılamıyordu — kod yazmadan önce yaklaşım kullanıcıya `AskUserQuestion` ile soruldu, **Overpass API ile gerçek liste** seçildi (diğer seçenekler: Nominatim-arama-bazlı öneri, ya da mevcut haliyle bırakma).
- Yerel veri setinde (ve Nominatim'de) "bu mahalledeki tüm sokaklar" sorgusu yok; bunun için OpenStreetMap'in **Overpass API**'si kullanıldı: (1) Nominatim `/search`'ten mahallenin kaba `boundingbox`'ı alınır (`NominatimService.boundingBox()` — `forward()` ile aynı `/search` çağrısını ve cache'i paylaşır, `search()` adlı ortak private metoda refactor edildi), (2) o bbox içindeki `way["highway"]["name"]` elemanları Overpass'tan çekilir (`OverpassService.streetsInBoundingBox()`, mahalle bazında bellekte cache'lenir). Yeni endpoint: `GET /geo/streets?province=&district=&neighborhood=&q=` (`StreetsQueryDto`), backend'de `q` ile substring filtreleniyor (mahalle/il/ilçe ile aynı desen), max 50 sonuç.
- **Gotcha**: Overpass, User-Agent header'ı olmayan isteklere `406 Not Acceptable` (HTML hata sayfası) dönüyor — `NominatimService` ile aynı `NOMINATIM_USER_AGENT` env değişkeni `OverpassService`'e de eklendi.
- Frontend: `street` alanı artık düz `Input` değil, diğer 3 alanla birebir aynı desende bir `Combobox` (`useStreets` hook, boş sorguda bile mahalledeki tüm sokakları listeler, yazınca `q` ile filtrelenir). `onSelectOption` ile seçilince `handleSelectStreet` forward-geocode edip haritayı zoom 17'de o sokağa uçuruyor (mahalle ile aynı desen — eski blur tabanlı yaklaşım kaldırıldı). Zincir tutarlılığı için artık il/ilçe/mahalle değiştiğinde `street` de otomatik temizleniyor (`handleSelectProvince`/`handleSelectDistrict`/`handleSelectNeighborhood` içinde).
- Test: `curl "GET /geo/streets?...&neighborhood=Kızılay"` gerçek 38 sokaklık liste döndürdüğü doğrulandı (`q=izmir` filtresi de 3 sonuca daraltıyor). `apps/api` `tsc --noEmit`, `apps/web` `tsc -b` sıfır hata, `test:e2e` 58/58 geçti (streets/forward endpoint'lerine ayrı e2e eklenmedi — gerçek dış ağ çağrısı yaptıkları için, forward endpoint'teki gibi curl+Playwright ile doğrulandı, CI mock gerektirir, MVP kapsamında atlandı). **Browser doğrulaması (Playwright, scratchpad)**: mahalle seçildikten sonra boş sokak alanına tıklayınca mahalledeki 39 gerçek sokak listelendi (ekran görüntüsüyle doğrulandı), "izmir" yazınca 3 sonuca filtrelendi, birini seçince harita o caddeye uçtu; tam bir taşınmaz oluşturma akışı (il→ilçe→mahalle→sokak seçimi, haritaya tıklayıp pin bırakma, kaydet) uçtan uca çalıştı ve detay sayfasında seçilen sokak adı doğru göründü, test kaydı API üzerinden temizlendi.

### Bugfix: mahalle her zaman boş dönüyordu ("X Mahallesi" eşleştirme sorunu)
- İlk browser doğrulamasında il/ilçe otomatik dolarken **mahalle hep boş kalıyordu**. Kök neden: Nominatim mahalleyi `address.suburb` alanında **"Namık Kemal Mahallesi"** gibi "Mahallesi" ekiyle döndürüyor, oysa yerel veri setinde (`neighborhoods.json`) aynı kayıt ekşiz — **"Namık Kemal"**. `geo.service.ts`'teki `matchNeighborhood` birebir (normalize edilmiş) string eşitliği arıyordu, ek yüzünden hiçbir zaman eşleşmiyordu.
- Çözüm: `geo.util.ts`'e `stripNeighborhoodSuffix()` eklendi (sondaki " Mahallesi"/" Mahalle" ekini atar), `matchNeighborhood` eşleştirmeden önce bunu uyguluyor. Regresyon testi `geo.e2e-spec.ts`'e eklendi (58. test).
- İl/ilçe alanlarında bu sorun yoktu (Nominatim `province`/`county`/`town` alanları zaten ek taşımıyor).
