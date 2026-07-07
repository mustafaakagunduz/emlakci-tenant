# Geo veri seti — kaynak ve lisans

`provinces.json`, `districts.json`, `neighborhoods.json` dosyaları
[TurkiyeAPI](https://github.com/ubeydeozdmr/turkiye-api) projesinin
2025 statik veri setinden (`https://api.turkiyeapi.dev/v2/datasets/2025/*.json`)
türetilmiştir. Kaynak proje **MIT lisanslıdır**.

Bu repoya alınırken alanlar sadeleştirildi (yalnızca `id`, `name`,
`provinceId`/`districtId`, il/ilçe için `lat`/`lng`). İlçe koordinatları
kaynak veri setinde yoktu; `apps/api/scripts/fetch-district-coords.js`
betiği ile Nominatim (OpenStreetMap) üzerinden bir kereye mahsus
çekilip bu dosyalara yazıldı — çalışan uygulama Nominatim'e ilçe
koordinatı için hiçbir zaman istek atmaz.

Mahalle listesi (~32.000 satır) yalnızca backend'den `/geo/neighborhoods`
endpoint'i ile sunulur, frontend bundle'ına gömülmez.
