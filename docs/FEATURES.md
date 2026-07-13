# DebtClear Planner — Dokumentasi Fitur

DebtClear Planner adalah aplikasi perencana pelunasan utang personal untuk pasar Indonesia. Pengguna mencatat semua utangnya (KTA, kartu kredit, pinjol, dll.), lalu aplikasi menghitung strategi pelunasan yang paling hemat bunga dan tercepat. Aplikasi bersifat **offline-first** — semua data tersimpan lokal di perangkat, dengan sinkronisasi cloud opsional untuk member Pro.

**Platform:** Web (Vite SPA) dan Android (Capacitor).

---

## 1. Manajemen Utang

### 1.1 Tambah / Edit / Hapus Utang
- Form input utang (`src/components/DebtForm.js`) dengan field: nama, jenis utang, pokok pinjaman, bunga per tahun (%), cicilan minimum bulanan, tanggal jatuh tempo, dan **tenor (bulan, opsional)**.
- Validasi input (`src/utils/validation.js`), termasuk batas nama maksimal 100 karakter.
- Utang bisa ditandai lunas (`isPaidOff`), diedit, atau dihapus.
- Daftar utang ditampilkan sebagai kartu (`DebtCard.js` / `DebtList.js`) dengan ringkasan tiap utang.

### 1.2 Catat Cepat "Bahasa Pinjol" (Quick-Add)
- Form capture 15 detik (`src/pages/QuickAddPage.js`, route `/quick-add`, tombol "⚡ Catat Cepat" di dashboard) dengan 3 angka yang dipakai pinjol: **uang yang diterima, bayar per bulan, berapa kali bayar** + tanggal jatuh tempo.
- Bunga tahunan, tenor, dan total kewajiban dihitung otomatis (`src/utils/quickAdd.js`), dengan preview langsung: "Total yang akan kamu bayar: Rp X (bunga ≈ Y%/thn)".
- Link ke form lengkap tersedia untuk kasus yang butuh field detail.

### 1.3 Audit Utang (Checklist Provider)
- Halaman terpandu (`src/pages/AuditPage.js`, route `/audit`, tombol "🔍 Audit Utang" di menu dashboard & empty state) untuk menemukan pinjaman yang terlupa.
- Checklist ~20 provider populer per kategori — PayLater (SPayLater, GoPay Later, Kredivo, …), Pinjol (AdaKami, JULO, …), Cicilan Barang, Bank (`src/data/auditProviders.js`).
- Provider yang sudah punya utang tercatat otomatis bertanda "✓ Sudah tercatat"; tombol "⚡ Catat" membuka Quick-Add dengan nama provider ter-prefill, lalu kembali ke checklist untuk lanjut mengaudit.

### 1.4 Template Pinjol
- Tersedia template siap pakai untuk pinjaman online umum di Indonesia (`src/data/pinjolTemplates.js`), mengacu pada praktik pasar / batas OJK:
  - Pinjol harian tenor 7 dan 14 hari (~0,3%/hari)
  - Pinjol bulanan tenor 30 hari (~0,4%/hari)
  - Pinjol cicilan tenor 3 dan 6 bulan (~7–8%/bulan)
- Memilih template otomatis mengisi bunga tahunan, jatuh tempo, dan estimasi cicilan minimum.

### 1.5 Import Massal via CSV
- Modal import CSV (`src/components/CsvImport.js`) berbasis PapaParse.
- Fitur: drag-and-drop file, template CSV yang bisa diunduh (`/template-utang.csv`), pratinjau data sebelum import, pilih baris via checkbox, dan laporan error per baris.

### 1.6 Sisa Kewajiban & Auto-Lunas (Model A)
- Utang ber-tenor punya **total kewajiban** = cicilan minimum × tenor; setiap pembayaran tercatat mengurangi sisa kewajiban satu cicilan (`src/utils/obligation.js`).
- Kartu utang menampilkan **Cicilan Berjalan (mis. 2/3 bulan)** dan **Sisa Kewajiban**.
- Field opsional "cicilan yang sudah dibayar sebelum dicatat" untuk utang lama yang diinput di tengah masa cicilan.
- **Auto-lunas:** utang otomatis berstatus Lunas saat jumlah cicilan terbayar mencapai tenor, dan otomatis batal jika pembayaran di-uncheck.

### 1.7 Takar Kemampuan Bayar (Rasio Cicilan/Penghasilan)
- Panel **"Takar Kemampuan Bayar"** di atas Tagihan Bulan Ini (`src/components/IncomeRatio.js`, kalkulasi di `src/utils/ratio.js`).
- User memasukkan penghasilan bulanan (perkiraan kasar boleh) → tampil **persentase besar + chip zona + kalimat status**: hijau <30% (Aman), kuning 30–50% (Waspada), merah >50% (Bahaya); pesan khusus jika cicilan melebihi penghasilan.
- Rasio ter-update otomatis saat utang berubah atau pembayaran dicentang.
- Penghasilan **hanya tersimpan lokal di perangkat** (localStorage), tidak ikut cloud sync.

### 1.8 Halaman Detail Utang
- Klik kartu utang membuka halaman detail (`src/pages/DebtDetailPage.js`, route `/debt-detail?id=`).
- **Utang ber-tenor:** sisa & total kewajiban, progress cicilan, dan **jadwal cicilan per bulan hingga lunas** dengan status per baris (✓ dibayar + tanggal / Bulan Ini / Terlambat), termasuk catatan cicilan yang dibayar sebelum dicatat.
- **Utang tanpa tenor:** sisa pokok (diperbarui manual lewat Edit) + riwayat pembayaran — tanpa jadwal proyeksi.

### 1.9 Pencatatan Pembayaran Bulanan
- Setiap tagihan cicilan bisa ditandai **sudah dibayar / belum** per bulan (`src/components/MonthlyBills.js`, tabel `payments` di IndexedDB).
- Riwayat pembayaran tersimpan per utang per bulan (tanggal bayar + nominal).
- Status "Terlambat" otomatis muncul jika tanggal jatuh tempo sudah lewat dan belum dibayar; "Segera Jatuh Tempo" muncul H-3.

### 1.10 Tagihan Gabungan Bulanan
- Panel **"Tagihan Bulan Ini"** di dashboard menggabungkan cicilan semua provider utang di bulan yang sama:
  - Total tagihan bulan berjalan, total sudah dibayar, dan sisa yang belum dibayar.
  - Checklist bayar per tagihan, diurutkan berdasarkan tanggal jatuh tempo.
  - Progress bar pembayaran bulan berjalan (mis. "2/5 tagihan dibayar").
  - Navigasi antar bulan (◀ ▶) untuk melihat riwayat atau bulan depan.

### 1.11 Provider & Aturan Tagihan
- Utang bisa terhubung ke **preset provider** (`src/data/auditProviders.js`) dengan dua atribut perilaku: cara menagih (**gabungan** vs per-pinjaman) dan **autodebit**.
- **Tagihan gabungan** (Kredivo, GoPay Later, dll.): semua pinjaman aktif di provider yang sama tampil sebagai **satu baris tagihan dengan satu checkbox** (`src/utils/billGrouping.js`) — mencentang membayar semuanya sekaligus, sesuai cara provider menagih. Rincian per pinjaman bisa di-expand.
- **Autodebit** (kartu kredit, KTA bank): bahasa berubah — baris tagihan berbunyi "pastikan saldo cukup", dan reminder Android menjadi "💳 Besok Autodebit! Pastikan saldo cukup…".
- Penautan provider otomatis: Quick-Add mencocokkan nama ke preset, dan **backfill sekali jalan** menautkan utang lama yang namanya cocok (`backfillProviderIds`). Bisa juga dipilih manual di form lengkap.
- Rincian grup menampilkan **total "Lunasi semua sekarang"** — jumlah sisa kewajiban seluruh pinjaman di provider tersebut (Kredivo mewajibkan pelunasan sekaligus).

### 1.12 Simulasi "Mau Pinjam Lagi?"
- Halaman `/simulate` (`src/pages/SimulatePage.js`, tombol di kartu Takar) — momen intervensi **sebelum** menekan "Ajukan" di aplikasi pinjol.
- Input penawaran dalam bahasa pinjol (terima berapa, bayar per bulan, berapa kali) → dampak langsung: **tagihan bulanan sekarang → nanti**, biaya pinjaman (total bayar + bunga ≈ %/thn), dan **rasio sekarang → nanti** dengan chip zona.
- Peringatan bertingkat: masuk zona Bahaya (>50%) dan cicilan melebihi penghasilan (🛑).
- Dua jalan keluar: "👍 Tidak jadi pinjam" (CTA utama) atau "Tetap pinjam & catat" yang membuka Quick-Add dengan semua angka ter-prefill.

---

## 2. Strategi Pelunasan

### 2.1 Metode Snowball & Avalanche
- **Snowball**: melunasi utang dengan pokok terkecil dulu (motivasi psikologis).
- **Avalanche**: melunasi utang dengan bunga tertinggi dulu (paling hemat bunga).
- Pemilihan strategi via `StrategyPicker.js`; preferensi tersimpan di `localStorage`.
- **Aturan pelunasan provider gabungan**: pinjaman-pinjaman di provider gabungan (Kredivo dkk.) di-merge jadi satu utang virtual di mesin simulasi (`mergeConsolidatedDebts`) — rencana pelunasan tidak pernah menyarankan melunasi salah satu pinjaman Kredivo saja, karena di dunia nyata itu tidak bisa dieksekusi. Bunga memakai rata-rata tertimbang pokok.

### 2.2 Simulasi Jadwal Pelunasan
- Mesin kalkulasi di `src/utils/strategy.js` (`calculatePayoffSchedule`):
  - Menghitung jadwal bulanan hingga semua utang lunas (batas aman 360 bulan / 30 tahun).
  - Anggaran bulanan tetap = total cicilan minimum awal + dana ekstra (metode rollover: cicilan utang yang lunas dialihkan ke utang berikutnya).
  - Output: jadwal per bulan, total bunga yang dibayar, lama pelunasan, dan deteksi kondisi "tak terhingga" (cicilan tidak menutup bunga).

### 2.3 Perbandingan Strategi
- `StrategyComparison.js` menampilkan Snowball vs Avalanche berdampingan: lama pelunasan dan total bunga masing-masing.
- Strategi paling hemat diberi badge "Paling Hemat", plus estimasi bunga dan bulan yang dihemat.

### 2.4 Anggaran Tambahan (Snowflake)
- `ExtraPayment.js`: input dana ekstra bulanan via kolom rupiah atau slider (Rp 0 – Rp 5.000.000, step Rp 100.000).
- Perubahan langsung memicu kalkulasi ulang simulasi (dengan debounce). Nilai tersimpan di `localStorage`.

### 2.5 Grafik Proyeksi
- `TimelineChart.js` (Chart.js): grafik proyeksi penurunan saldo utang dari waktu ke waktu.

---

## 3. Export & Laporan

### 3.1 Export PDF
- `src/utils/pdfExport.js` (html2pdf.js): menghasilkan dokumen "Rencana Pelunasan Utang" format A4 berisi ringkasan utang, grafik proyeksi (snapshot dari chart aktif), jadwal pelunasan, dan tanggal bebas utang.
- Versi **Free** mendapat watermark "DEBTCLEAR FREE VERSION"; versi **Pro** tanpa watermark.

---

## 4. Akun & Cloud (Supabase)

### 4.1 Autentikasi
- Daftar/masuk dengan email + password, dan **Google OAuth** (`src/utils/supabase.js`, `AuthModal.js`).
- Tanpa login, aplikasi tetap berfungsi penuh secara lokal.

### 4.2 Sinkronisasi Cloud (khusus Pro)
- `src/utils/sync.js`: sinkronisasi dua arah antara IndexedDB lokal (Dexie) dan tabel `debts` + `payments` di Supabase (termasuk tenor, cicilan berjalan, dan provider).
- Mendukung antrian penghapusan offline (`deleted_debts`, `deleted_payments`) — utang/status bayar yang dihapus saat offline ikut dihapus di cloud saat sinkron berikutnya; penghapusan utang meng-cascade riwayat pembayarannya di cloud.
- Skema cloud: `supabase/migrations/20260713_payments_and_debt_fields.sql` (tabel `payments` dengan RLS per-user + kolom baru `debts`).
- Indikator status sync (☁️) di header dashboard; UI mendengarkan event `sync-state-change`.
- User Free diblokir dengan pesan "Fitur sinkronisasi cloud hanya untuk member Pro."

---

## 5. Monetisasi — DebtClear Pro

### 5.1 Paket & Harga
- Halaman pricing (`src/pages/PricingPage.js`) menampilkan plan Free vs Pro beserta status langganan aktif (tanggal kedaluwarsa).
- Harga: **Rp 29.900 / bulan**.

### 5.2 Pembayaran via Xendit
- Supabase Edge Functions (`supabase/functions/`):
  - `create-invoice`: membuat invoice Xendit untuk user terautentikasi (invoice berlaku 15 menit).
  - `xendit-webhook`: menerima callback pembayaran dan mengaktifkan langganan di tabel `subscriptions`.
- `PaymentModal.js`: membuka invoice di tab baru dan mem-polling status hingga pembayaran sukses.

### 5.3 Gating Fitur Pro
- Pengecekan status via `src/utils/premium.js` (`isProUser`): langganan `active` dan belum kedaluwarsa.
- Fitur Pro saat ini: **sinkronisasi cloud** dan **export PDF tanpa watermark**.

---

## 6. Fitur Mobile (Android / Capacitor)

- Build Android via Capacitor (`npm run android`), dengan splash screen.
- **Pengingat jatuh tempo** (`src/utils/notifications.js`): notifikasi lokal native dijadwalkan otomatis **H-1 sebelum jatuh tempo pukul 09.00** untuk setiap utang aktif; jadwal lama dibersihkan otomatis agar tidak duplikat.
- Pengingat **terhubung dengan pencatatan pembayaran**: tagihan yang sudah ditandai dibayar di bulan tersebut tidak akan dikirimi reminder.

---

## 7. Penyimpanan & Data

- **Lokal (utama):** IndexedDB via Dexie (`src/utils/storage.js`), tabel `debts`, `deleted_debts`, `payments`, dan `deleted_payments`. Perubahan data memicu event `local-db-changed` dan penjadwalan ulang notifikasi.
- **Positioning privasi:** app bisa dipakai 100% anonim — dikomunikasikan di landing ("data tersimpan di perangkatmu") dan notice sekali-tampil di dashboard yang jujur soal risikonya (data hilang jika data situs browser dihapus / uninstall) sekaligus mengarahkan ke backup cloud Pro.
- **Preferensi:** `localStorage` (strategi, dana ekstra, tema).
- **Cloud (Pro):** Supabase Postgres, tabel `debts` dan `subscriptions`.

---

## 8. UI / UX

- Tiga halaman utama (routing di `src/main.js`): **Landing Page**, **Dashboard**, dan **Pricing**.
- Tema **gelap/terang** (default gelap), tersimpan di `localStorage`.
- Semua teks UI berbahasa Indonesia, terpusat di `src/data/strings.js`; format mata uang Rupiah (`src/utils/format.js`).
- Desain "banking/crypto aesthetic" dengan efek glow, header tetap saat scroll, dan layout responsif.
- **Mobile-first ordering:** di layar kecil, kolom actionable (Takar → Tagihan Bulan Ini → daftar utang) tampil lebih dulu; grafik strategi menyusul di bawah.
- **Landing bergaya fintech** (referensi Cruip FinTech): badge kepercayaan, dual CTA (Mulai / Lihat Cara Kerja dengan smooth-scroll), strip statistik (100% anonim · 15 detik catat · 2 strategi), dan section CTA penutup.

---

## Ringkasan Free vs Pro

| Fitur | Free | Pro (Rp 29.900/bln) |
|---|---|---|
| Catat utang tanpa batas (lokal) | ✅ | ✅ |
| Strategi Snowball & Avalanche + perbandingan | ✅ | ✅ |
| Simulasi & grafik proyeksi | ✅ | ✅ |
| Import CSV & template pinjol | ✅ | ✅ |
| Checklist tagihan gabungan bulanan | ✅ | ✅ |
| Pengingat jatuh tempo (Android) | ✅ | ✅ |
| Export PDF | ✅ (watermark) | ✅ (tanpa watermark) |
| Sinkronisasi cloud antar perangkat | ❌ | ✅ |
