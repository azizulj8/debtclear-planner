# DebtClear Planner — Product Backlog

> Hasil brainstorm 12 Juli 2026. Target persona v-next: pengguna yang **mau** mencatat pinjamannya dan ingin mengaudit keuangan serta menakar kemampuan bayar bulanan (bukan pengguna yang denial).

## Now (prioritas v-next)

### 1. Meteran Rasio Cicilan / Penghasilan ("Takar") — ✅ SHIPPED 12 Jul 2026
Fondasi value loop — dibangun paling dulu karena membuat pencatatan terasa ada gunanya.
- Input penghasilan bulanan (sekali, kasar/rentang boleh — persona pekerja informal berpenghasilan tidak tetap).
- Tampilkan rasio total cicilan bulanan vs penghasilan di atas panel Tagihan Bulan Ini.
- Zona: hijau <30%, kuning 30–50%, merah >50% (anchor: patokan kelayakan kredit OJK ~30–40%).
- Data penghasilan tersimpan lokal saja.
- **Asumsi paling berisiko:** user mau memasukkan gaji. Validasi dulu dengan UX "masukkan gaji → langsung lihat rasio".

### 2. Halaman Detail Utang — ✅ SHIPPED 12 Jul 2026
- Sisa utang berjalan (pokok berkurang mengikuti pembayaran tercatat).
- Jadwal cicilan per bulan hingga lunas (dari tenor + cicilan minimum): "Ags: Rp X, Sep: Rp X, ...".
- Riwayat pembayaran (dari tabel `payments`): tanggal bayar & nominal per bulan.
- Progress pelunasan (mis. "3/6 cicilan, sisa Rp 2,4 jt").

### 3. Quick-Add "Bahasa Pinjol" — ✅ SHIPPED 12 Jul 2026
Form capture 15 detik dengan 3 field sesuai cara pinjol berkomunikasi:
- *Pinjam berapa, bayar berapa, kapan* → bunga & tenor dihitung otomatis.
- Menggantikan keharusan tahu "bunga tahunan %" yang tidak pernah disebut pinjol.

### 4. Audit Utang (onboarding terpandu) — ✅ SHIPPED 12 Jul 2026
- Flow terpandu: "buka satu-satu aplikasi pinjolmu, cek menu tagihan, masukkan sini".
- Checklist provider pinjol legal populer: "punya akun di sini? cek sekarang".
- Cocok jadi momen "aha" pertama pengguna baru; menjawab masalah rekonsiliasi (utang lupa di provider B).

## Next

### 5. Provider sebagai Entitas (Grouping & Aturan Tagihan)
Unit pencatatan = pinjaman, unit tagihan = provider. Tiap provider punya aturan berbeda:
- **Cara menagih:** gabungan (Kredivo: semua pinjaman aktif terakumulasi jadi 1 tagihan bulanan) vs per-pinjaman (SPayLater: tiap pinjaman berdiri sendiri).
- **Cara bayar:** autodebit (kartu kredit — reminder berubah jadi "pastikan saldo cukup H-1"; konfirmasi "terpotong sukses/gagal", bukan checkbox bayar) vs manual.
- **Aturan pelunasan dini:** Kredivo wajib lunasi semua sekaligus; Shopee boleh per pinjaman. Berdampak ke mesin Snowball/Avalanche: pinjaman dalam provider gabungan efektif satu utang, tidak bisa dieliminasi terpisah.
- Panel Tagihan Bulan Ini di-group by provider; provider gabungan = satu baris + satu checkbox, expand untuk rincian.
- Provider **opsional** (utang tanpa provider jalan seperti sekarang) dan pakai **preset** (Kredivo, SPayLater, Akulaku, dll.) — bukan didefinisikan manual. Daftar preset dipakai ulang untuk checklist Audit Utang (#4).

### 6. Simulasi "Mau Pinjam Lagi?"
- Input nominal & tenor pinjaman baru → tampilkan dampak: rasio naik jadi berapa %, tagihan bulan depan jadi berapa.
- Momen intervensi sebelum keputusan pinjam — differentiator utama vs aplikasi pinjol.
- Bergantung pada #1 (rasio) dan #3 (parameter pinjol mudah dimasukkan).

## Later / Parked

### 7. Deteksi pinjaman semi-otomatis (Android)
- Tangkap SMS/notifikasi pencairan pinjol → konfirmasi satu tap untuk mencatat.
- **Ditahan:** permission sensitif, isu privasi, review Play Store ketat untuk app finansial. Baru layak setelah terbukti user yang diberi cara mudah pun konsisten mencatat.

### 8. Sinkronisasi tabel `payments` ke cloud (Pro)
- Riwayat pembayaran saat ini hanya lokal; belum ikut sync Supabase.

## Catatan produk
- Value loop: **Audit** (temukan semua utang) → **Takar** (sadar posisi) → **Capture cepat** (catat 15 detik) → kembali ke Takar.
- Retensi: posisikan app sebagai tempat *menakar sebelum memutuskan pinjam*, bukan sekadar pencatat (pencatat punya "kematian alami" saat user disiplin).
- Persona utama masih perlu diputuskan: karyawan bergaji tetap vs pekerja informal (mempengaruhi desain input penghasilan).
