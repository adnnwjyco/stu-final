# Rencana: Overlay Hapus, Alur Serah-Terima Divisi + Timer, Grafik Bulanan

## Konteks (temuan eksplorasi)
- Hapus JO: `confirm()` browser di `app/dashboard/isi/job-order.jsx:169`, server action `hapusJo` di `app/actions/job-order.ts:259`
- Hapus pelanggan: `confirm()` di `app/dashboard/isi/pelanggan.jsx:132`, action `hapusPelanggan` di `app/actions/pelanggan.ts:79`
- Komponen `Overlay` reusable sudah ada di `app/dashboard/isi/util.jsx:57`
- Serah terima saat ini: satu klik langsung pindah divisi (`serahTerima` di `job-order.ts:164`), tanpa konfirmasi & tanpa timestamp
- Schema `job_orders` (`db/schema.sql:34`): hanya `tanggal_terima`/`tanggal_selesai` (DATE) — belum ada kolom timing per divisi
- Pipeline divisi: `lib/akses.ts:41` (`desainer → … → gudang`)
- Dashboard `beranda.jsx`: hanya kartu statistik + tabel 5 JO terakhir, belum ada grafik; belum ada library chart
- Tracking publik `app/actions/lacak.ts` memetakan step dari `divisi_pengerjaan` — perlu menyesuaikan state "menunggu terima"

Keputusan user:
- JO baru (mulai di Desainer) juga **harus konfirmasi terima** — konsisten dengan divisi lain
- Grafik: **install library chart** (recharts)
- Rentang grafik: **semua data** (semua bulan yang ada di DB)

---

## 1. Overlay konfirmasi hapus (JO & pelanggan)

### 1a. Komponen `KonfirmasiHapus` di `app/dashboard/isi/util.jsx`
- Komponen kecil berbasis `Overlay` yang sudah ada: judul, pesan, tombol "Ya, Hapus" (merah) & "Batal", dukung `pending` state, opsional tampilkan `errors`
- Escape / klik backdrop = batal (sudah ditangani `Overlay`)

### 1b. `app/dashboard/isi/job-order.jsx`
- Ganti `confirm(...)` + `hapus()` (baris ~165–175) → state `hapusBuka` + `<KonfirmasiHapus>`; `alert(hasil.errors[0])` (baris 136) ditampilkan di dalam overlay
- Bonus konsistensi (masih di file yang sama, kecil): ganti `confirm` batalkan JO (baris ~310) dan hapus produk (baris ~361) dengan overlay yang sama

### 1c. `app/dashboard/isi/pelanggan.jsx`
- Ganti `confirm(...)` + `hapus()` (baris ~129–137) → state + `<KonfirmasiHapus>`; error `hapusPelanggan` (FK JO existing → "Gagal menghapus") tampil di overlay

---

## 2. Alur serah-terima: konfirmasi terima + timer

### 2a. Schema (`db/schema.sql` + migrasi idempoten)
Tambah kolom ke `job_orders`:
```sql
ALTER TABLE job_orders ADD COLUMN IF NOT EXISTS menunggu_terima BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE job_orders ADD COLUMN IF NOT EXISTS diterima_pada TIMESTAMP;
```
(Pakai `ADD COLUMN IF NOT EXISTS` di akhir `schema.sql` agar `npm run db:migrate` aman untuk DB lama & baru.)

- `menunggu_terima = TRUE` → JO sudah dititipkan ke divisi tapi divisi itu belum konfirmasi
- `diterima_pada` → timestamp saat divisi mengklik "Terima"; di-reset `NULL` tiap serah terima

### 2b. Server actions (`app/actions/job-order.ts`)
- **Pembuatan JO** (insert, baris ~92): set `menunggu_terima = TRUE` (Desainer harus terima dulu)
- **Action baru `terimaJo(formData)`**: validasi `bolehKelola`, JO aktif, `menunggu_terima = TRUE`; set `menunggu_terima = FALSE, diterima_pada = NOW()`; catat audit `terima_job_order`
- **`serahTerima` dirombak** (baris 164–207):
  - Tolak jika `menunggu_terima = TRUE` ("Anda belum mengkonfirmasi penerimaan")
  - Pindah divisi: `divisi_pengerjaan = berikutnya, menunggu_terima = TRUE, diterima_pada = NULL, status = 'proses'`
  - Divisi terakhir (gudang) "Tandai Selesai": hanya boleh jika sudah diterima (`menunggu_terima = FALSE`)
- **`ubahProgress`** (baris 124): tolak jika `menunggu_terima = TRUE` (belum resmi menerima)
- `ambilJo` (baris 31): tambahkan `menunggu_terima, diterima_pada` ke SELECT

### 2c. UI job order (`app/dashboard/isi/job-order.jsx`)
- **PanelJo**:
  - Jika JO milik user & `menunggu_terima = TRUE` → tampilkan banner "Menunggu penerimaan" + tombol **Terima** (`useActionState` → `terimaJo`); tombol serah terima & progress disembunyikan sampai diterima
  - Jika sudah diterima → tombol "Serah Terima ke X" / "Tandai Selesai" seperti sekarang
- **Timer durasi di divisi**: komponen kecil `DurasiDivisi({ sejak })` — hitung live `now − diterima_pada` (format "2j 15m"), update tiap 30 detik via `setInterval`; tampilkan di panel JO ketika `diterima_pada` ada (durasi sejak proses terima sampai serahkan lagi)

### 2d. Penyesuaian pendukung
- `lib/data.ts` (`JobOrderRow` + query SELECT JO): sertakan `menunggu_terima, diterima_pada`
- `app/actions/lacak.ts` (tracking publik): step divisi dengan `menunggu_terima = TRUE` → status langkah "Menunggu Konfirmasi" (distinct dari "aktif"/"selesai"); `diterima_pada` dipakai untuk menentukan langkah aktif vs menunggu
- (Catatan: sebelum menulis kode Next.js, cek dulu `node_modules/next/dist/docs/` sesuai AGENTS.md)

---

## 3. Grafik rangkuman bulanan di dashboard

### 3a. Install
- `npm install recharts`

### 3b. Data
- `lib/data.ts`: fungsi baru `getStatistikBulanan(lingkupDivisi?)`:
  ```sql
  SELECT to_char(date_trunc('month', tanggal_terima), 'YYYY-MM') AS bulan,
         COUNT(*)::int AS jumlah
  FROM job_orders [WHERE divisi_pengerjaan = $1]
  GROUP BY 1 ORDER BY 1
  ```
  (semua bulan yang ada; ikut scoping divisi seperti statistik lain bila `lingkup` divisi)
- `app/api/statistik/route.ts`: tambah field `bulanan` ke respons (gilir `getStatistikBulanan` dalam `Promise.all`)
- Update tipe `Statistik` di `lib/data.ts`

### 3c. UI (`app/dashboard/isi/beranda.jsx`)
- Kartu/section baru "Rangkuman Bulanan Job Order (tanggal terima)" — `BarChart` recharts (client component terpisah, mis. `app/dashboard/isi/grafik-bulanan.jsx`, `'use client'`)
- Tooltip recharts, label bulan diformat (Jan, Feb, … atau "Jan 2026"), warna bar konsisten tema (biru slate/emerald Tailwind)
- Empty state jika tidak ada data (pakai `Kosong` dari util)

---

## Urutan eksekusi
1. Schema + migrate (kolom baru)
2. Actions JO: `terimaJo`, rombak `serahTerima`/`ubahProgress`/insert, `ambilJo`
3. `lib/data.ts` (row type) + `lacak.ts`
4. UI `job-order.jsx` (banner terima, tombol Terima, `DurasiDivisi`)
5. `KonfirmasiHapus` di util + integrasi job-order.jsx & pelanggan.jsx
6. `npm install recharts`, `getStatistikBulanan`, API statistik, grafik di beranda
7. Verifikasi: `npm run lint`, `npm run build`; uji manual alur (buat JO → terima → kerjakan → serah → terima → … → selesai; hapus dgn overlay; cek grafik & timer)

## File yang diubah
| File | Perubahan |
|---|---|
| `db/schema.sql` | +2 kolom + ALTER idempoten |
| `app/actions/job-order.ts` | `terimaJo` baru; rombak `serahTerima`, `ubahProgress`, insert, `ambilJo` |
| `lib/data.ts` | tipe row + SELECT JO; `getStatistikBulanan` |
| `lib/akses.ts` | (kemungkinan kecil) helper untuk state terima |
| `app/actions/lacak.ts` | dukung state "menunggu terima" |
| `app/dashboard/isi/util.jsx` | komponen `KonfirmasiHapus` |
| `app/dashboard/isi/job-order.jsx` | overlay hapus/batal/produk; banner terima + tombol Terima; `DurasiDivisi` |
| `app/dashboard/isi/pelanggan.jsx` | overlay hapus |
| `app/api/statistik/route.ts` | field `bulanan` |
| `app/dashboard/isi/beranda.jsx` | render grafik |
| `app/dashboard/isi/grafik-bulanan.jsx` | baru: BarChart recharts |
| `package.json` | + recharts |
