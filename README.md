# HMI Insan Cita — Frontend

Aplikasi Vue 3 + TypeScript + Vite untuk website publik dan panel admin HMI Insan Cita.

Dokumentasi lengkap dan kontrak API ada di [README utama](../README.md) dan [`apicontract.yaml`](../apicontract.yaml).

## Menjalankan

Pastikan backend sudah berjalan, lalu:

```bash
npm install
cp .env.example .env
npm run dev
```

Nilai bawaan `.env.example` mengarah ke backend lokal di `http://localhost:3001`.

## Perintah

| Perintah | Keterangan |
| --- | --- |
| `npm run dev` | Server pengembangan Vite. |
| `npm run build` | Type-check (`vue-tsc`) lalu build produksi ke `dist/`. |
| `npm run preview` | Jalankan hasil build secara lokal. |

## Koneksi data

Frontend hanya memakai API backend sungguhan; tidak ada mock adapter atau fallback konten lokal.

- `VITE_API_BASE_URL` — base URL backend (tanpa trailing slash), harus sama dengan `servers[0].url` pada `../apicontract.yaml`.
- Login admin memakai Supabase Auth melalui endpoint backend. Akun dibuat dengan `npm run create-admin` di folder `backend`.
- Jika data belum tersedia, halaman menampilkan empty state netral, bukan data contoh.

Alur data: view → Pinia store → service (`src/api/services`) → HTTP client (`src/api/http.ts`) → backend.
