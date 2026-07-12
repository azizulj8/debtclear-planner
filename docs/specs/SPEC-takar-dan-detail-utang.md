# PRD: Meteran Rasio Cicilan ("Takar") & Halaman Detail Utang

**Status:** SHIPPED (Fase 1–3 lengkap: R1–R5) · 12 Juli 2026
**Sumber:** Sesi brainstorm 12 Juli 2026 ([BACKLOG.md](../BACKLOG.md) item #1 & #2)

---

## Problem Statement

Pengguna pinjol meminjam di banyak provider tanpa pencatatan, lalu kaget saat total tagihan bulanan membengkak — mereka tahu pinjam "sedikit" di provider A tapi lupa punya pinjaman di provider B. DebtClear sudah punya pencatatan dan checklist tagihan bulanan, tapi belum menjawab dua pertanyaan kunci pengguna: **"berapa persen penghasilanku habis untuk cicilan?"** dan **"untuk tiap utang, sisa berapa lagi dan sampai kapan?"** Tanpa dua jawaban ini, mencatat terasa tidak ada gunanya — dan pengguna berhenti mencatat.

**Target pengguna:** orang yang *sudah mau* mencatat pinjamannya dan ingin mengaudit posisi keuangannya (bukan pengguna yang denial). Termasuk pekerja informal berpenghasilan tidak tetap (driver ojol, pedagang, freelancer — demografi pinjol terbesar).

---

## Goals

1. Pengguna langsung melihat **rasio cicilan terhadap penghasilan** dalam <10 detik setelah memasukkan penghasilan (leading: ≥60% pengguna aktif mengisi penghasilan dalam 30 hari pertama rilis).
2. Pengguna bisa menjawab "sisa utangku berapa dan lunas kapan" untuk tiap utang tanpa menghitung manual (leading: ≥40% pengguna yang punya utang membuka halaman detail dalam 30 hari).
3. Pencatatan pembayaran jadi bermakna: setiap centang "dibayar" langsung mengubah sisa utang dan progress (lagging: retensi bulanan pengguna yang mengisi penghasilan > pengguna yang tidak).
4. Utang berstatus lunas otomatis dari data pembayaran, tanpa aksi manual (error rate status lunas keliru <2%).

## Non-Goals

- **Amortisasi bunga/pokok ala bank (Model B).** V1 memakai Model A "sisa kewajiban" — persona kita berpikir "sisa yang harus kubayar", bukan porsi bunga. Model B menuntut data bunga presisi yang merupakan friksi terbesar input.
- **Grouping/aturan provider (Kredivo dkk).** Entitas provider adalah backlog #5 — rasio dan detail tetap benar tanpa grouping.
- **Simulasi "mau pinjam lagi?".** Backlog #6, dibangun setelah rasio terbukti dipakai.
- **Sinkronisasi penghasilan & payments ke cloud.** Data penghasilan sensitif; v1 lokal-only, sekaligus jadi selling point privasi.
- **Saran keuangan otomatis** ("kamu harus…"). Kita menampilkan posisi, bukan menasihati — batas regulasi dan kepercayaan.

---

## User Stories

**Meteran Rasio (Takar)**
- Sebagai pekerja dengan penghasilan tidak tetap, aku mau memasukkan perkiraan penghasilan bulananku (angka kasar) supaya aku tahu berapa persen yang habis untuk cicilan.
- Sebagai pengguna yang baru selesai mencatat semua utangku, aku mau melihat satu angka rasio dengan zona warna supaya aku langsung paham posisiku aman atau bahaya.
- Sebagai pengguna, aku mau rasio ter-update otomatis saat aku menambah/melunasi utang supaya angka itu selalu bisa kupercaya.
- Sebagai pengguna yang khawatir privasi, aku mau tahu penghasilanku hanya tersimpan di HP-ku supaya aku berani mengisinya.

**Halaman Detail Utang**
- Sebagai pengguna, aku mau melihat sisa kewajiban tiap utang (total yang masih harus kubayar) supaya tahu beban riilku.
- Sebagai pengguna, aku mau melihat daftar cicilan per bulan sampai lunas ("Ags: Rp X ✓, Sep: Rp X, …") supaya bisa merencanakan kas bulanan.
- Sebagai pengguna, aku mau melihat riwayat pembayaranku (tanggal & nominal) supaya bisa membuktikan/mengecek pembayaran lama.
- Sebagai pengguna dengan utang tanpa tenor (kartu kredit revolving), aku mau tetap melihat riwayat pembayaran dan mengedit sisa saldo manual supaya utang jenis ini tetap terpantau tanpa dipaksa masuk model cicilan tetap.

---

## Requirements

### P0 — Must Have

**R1. Input penghasilan bulanan**
- Satu field nominal rupiah, bisa diedit kapan saja; tersimpan di perangkat (localStorage/IndexedDB), tidak ikut cloud sync.
- Copy menegaskan: "perkiraan kasar tidak apa-apa" dan "hanya tersimpan di HP kamu".
- [ ] Given penghasilan belum diisi, when dashboard dibuka, then muncul ajakan "isi penghasilan → lihat rasiomu" (bukan modal paksa).
- [ ] Given penghasilan diisi, then meteran rasio langsung tampil tanpa reload.

**R2. Meteran rasio di dashboard**
- Rasio = total cicilan minimum bulanan semua utang aktif ÷ penghasilan; posisi di atas panel Tagihan Bulan Ini.
- Zona: **hijau <30%**, **kuning 30–50%**, **merah >50%** (anchor patokan kredit OJK).
- [ ] Rasio ter-update otomatis saat utang ditambah/diedit/dihapus/lunas.
- [ ] Given penghasilan = 0/kosong, then meteran menampilkan ajakan isi, bukan angka ∞/NaN.
- [ ] Given rasio >100%, then tampil "cicilanmu melebihi penghasilanmu" (bukan bar yang overflow).

**R3. Sisa kewajiban Model A**
- Total kewajiban utang ber-tenor = cicilan minimum × tenor. Sisa = total kewajiban − Σ pembayaran tercatat (tabel `payments`).
- [ ] Setiap centang bayar di panel Tagihan Bulan Ini mengurangi sisa kewajiban utang tersebut; uncheck mengembalikannya.
- [ ] Given jumlah pembayaran tercatat = tenor, then utang otomatis berstatus **Lunas** (`isPaidOff`), keluar dari tagihan bulanan & simulasi, dan reminder-nya berhenti.
- [ ] Given pembayaran di-uncheck hingga < tenor, then status Lunas otomatis dibatalkan.

**R4. Halaman detail utang (utang ber-tenor)**
- Dibuka dari kartu utang. Isi: sisa kewajiban, progress ("3/6 cicilan, sisa Rp 2,4 jt"), jadwal per bulan hingga lunas dengan status per baris (✓ dibayar tgl X / belum / terlambat), dan info dasar utang.
- [ ] Jadwal dihitung dari tenor + cicilan minimum + tanggal jatuh tempo; bulan yang sudah dibayar bertanda ✓ beserta tanggal bayar.
- [ ] Baris bulan berjalan yang lewat jatuh tempo dan belum dibayar bertanda "Terlambat".

**R5. Halaman detail utang (tanpa tenor)**
- Tampilkan riwayat pembayaran + sisa pokok statis yang bisa diedit manual. **Tanpa** jadwal proyeksi.
- [ ] Given utang tanpa tenor, then tidak ada jadwal per bulan dan tidak ada auto-lunas; hanya riwayat + saldo editable.

### P1 — Nice to Have

- Nominal bayar yang bisa diedit saat mencentang (bayar lebih/kurang dari cicilan minimum) dan memengaruhi sisa kewajiban.
- Penghasilan sebagai rentang (Rp 3–5 jt) dengan rasio ditampilkan sebagai rentang.
- Ekspor jadwal cicilan per utang ke PDF (menyusul ekspor rencana yang sudah ada).
- Riwayat perubahan rasio dari bulan ke bulan (sparkline kecil).

### P2 — Future Considerations (jaga arsitektur)

- Entitas provider (backlog #5): halaman detail harus bisa menampilkan "bagian dari tagihan gabungan [provider]" nantinya — jangan hard-code asumsi 1 utang = 1 tagihan di layer tampilan detail.
- Simulasi "mau pinjam lagi?" (backlog #6) akan memakai fungsi rasio yang sama — pisahkan kalkulasi rasio sebagai util murni, bukan logic di komponen.
- Payments sync ke cloud (backlog #8): skema `payments` sudah kompatibel, jangan tambah field lokal-only tanpa penanda.

---

## Success Metrics

| Metrik | Tipe | Target (30 hari pasca rilis) |
|---|---|---|
| Pengguna aktif yang mengisi penghasilan | Leading | ≥60% |
| Pengguna ber-utang yang membuka halaman detail | Leading | ≥40% |
| Pengguna yang mencentang ≥1 pembayaran per bulan | Leading | ≥50% dari pengisi penghasilan |
| Retensi bulan ke-2 pengisi penghasilan vs bukan | Lagging | Lebih tinggi (arah, bukan angka — baseline belum ada) |

*Catatan: app belum punya analytics — instrumentasi minimal (event lokal → agregat anonim) adalah prasyarat pengukuran; lihat Open Questions.*

## Open Questions — RESOLVED 12 Juli 2026

1. **Penghasilan: angka atau rentang?** → Belum diputuskan; v1 jalan dengan **satu angka** (asumsi draft), rentang tetap P1. Revisit sebelum Fase 3.
2. **Field cicilan berjalan untuk utang lama?** → **Setuju.** Satu field opsional di form: "cicilan yang sudah dibayar sebelum dicatat". Sisa kewajiban memperhitungkannya.
3. **Analytics?** → Keputusan sementara: **tanpa third-party**. Mulai dari event counter anonim agregat (tanpa user id, tanpa nominal) — diimplementasikan terpisah setelah Fase 1–2, bukan blocker.
4. **Bentuk meteran rasio?** → **Angka persentase besar + chip zona berwarna + satu kalimat status** ("48% — Kuning: mendekati batas aman"). Tanpa grafik; harus langsung ketangkep mata di 360px.

## Timeline & Phasing

Tidak ada deadline eksternal. Usulan fase:
1. **Fase 1:** R3 (Model A + auto-lunas) — fondasi data, tanpa UI baru selain angka sisa di kartu.
2. **Fase 2:** R4 + R5 (halaman detail).
3. **Fase 3:** R1 + R2 (penghasilan + meteran rasio).

Fase 1–2 duluan karena memperbaiki makna data yang sudah dicatat pengguna hari ini; fase 3 menambah data baru (penghasilan) di atas fondasi yang sudah benar. Dependensi: fitur pencatatan pembayaran (sudah rilis, tabel `payments`).
