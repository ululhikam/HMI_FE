# HMI Insan Cita — Frontend

Aplikasi Vue 3 + TypeScript + Vite untuk website publik dan panel admin HMI Insan Cita.

Dokumentasi lengkap, mode data, dan kontrak API ada di [README utama](../README.md) dan [`apicontract.yaml`](../apicontract.yaml).

## Menjalankan

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Perintah

| Perintah | Keterangan |
| --- | --- |
| `npm run dev` | Server pengembangan Vite. |
| `npm run build` | Type-check (`vue-tsc`) lalu build produksi ke `dist/`. |
| `npm run preview` | Jalankan hasil build secara lokal. |

## Mode data

- `VITE_API_MODE=mock` — memakai mock adapter di `src/api/mock/`, tanpa backend.
- `VITE_API_MODE=http` — memanggil backend sesuai `VITE_API_BASE_URL`.

Alur data: view → Pinia store → service (`src/api/services`) → HTTP client (`src/api/http.ts`) → mock adapter/backend.
