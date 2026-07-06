# EmlakPanel

Türkiye'deki emlak ofisleri için multi-tenant portföy yönetim paneli. Detaylar için [CLAUDE.md](./CLAUDE.md).

## Kurulum

### Backend + veritabanı (Docker)

```bash
docker compose up -d
```

- API: http://localhost:3000
- Postgres: localhost:5432

Health check: `curl http://localhost:3000/health`

### Frontend (lokal)

```bash
cd apps/web
cp .env.example .env
npm install
npm run dev
```

- Web: http://localhost:5173

## Ortam değişkenleri

- `apps/api/.env` — bkz. `apps/api/.env.example`
- `apps/web/.env` — bkz. `apps/web/.env.example`
