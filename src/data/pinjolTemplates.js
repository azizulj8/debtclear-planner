/**
 * Pinjaman Online (Pinjol) Template Data based on typical Indonesian market offerings
 * compliant with OJK (Otoritas Jasa Keuangan) regulations or common practices.
 * Note: Interest rates in the app are modeled annually, so daily rates are annualized (daily * 365).
 */
export const PINJOL_TEMPLATES = [
  {
    id: 'pinjol-harian-7',
    name: 'Pinjol Harian (Tenor 7 Hari)',
    type: 'Pinjaman Online',
    interestRate: 109.5, // 0.3% per hari * 365
    dueDate: 7,
    description: 'Bunga harian tinggi (~0.3%/hari), jatuh tempo sangat singkat (7 hari). Umumnya untuk dana darurat kecil.',
    minPaymentPercent: 105 // Pelunasan sekaligus pokok + bunga (~5% bunga seminggu)
  },
  {
    id: 'pinjol-harian-14',
    name: 'Pinjol Harian (Tenor 14 Hari)',
    type: 'Pinjaman Online',
    interestRate: 109.5, // 0.3% per hari * 365
    dueDate: 14,
    description: 'Bunga harian (~0.3%/hari), jatuh tempo 2 minggu. Sangat umum digunakan sebelum gajian.',
    minPaymentPercent: 110 // Pokok + bunga ~10%
  },
  {
    id: 'pinjol-bulanan-30',
    name: 'Pinjol Bulanan (Tenor 30 Hari)',
    type: 'Pinjaman Online',
    interestRate: 146, // 0.4% per hari * 365 (batas maksimal lama OJK)
    dueDate: 30,
    description: 'Pinjaman tenor 1 bulan. Cicilan sekali lunas di akhir bulan (pokok + bunga ~12%).',
    minPaymentPercent: 112
  },
  {
    id: 'pinjol-cicilan-3',
    name: 'Pinjol Cicilan (Tenor 3 Bulan)',
    type: 'Pinjaman Online',
    interestRate: 96, // Rata-rata 8% per bulan cicilan * 12 bulan
    dueDate: 28,
    description: 'Tenor cicilan bulanan ringan 3 bulan. Bunga berkisar 8% per bulan dari total pinjaman.',
    minPaymentPercent: 41 // Estimasi cicilan per bulan (~41% dari pokok per bulan)
  },
  {
    id: 'pinjol-cicilan-6',
    name: 'Pinjol Cicilan (Tenor 6 Bulan)',
    type: 'Pinjaman Online',
    interestRate: 84, // Rata-rata 7% per bulan cicilan * 12 bulan
    dueDate: 28,
    description: 'Tenor cicilan menengah 6 bulan. Bunga bulanan sedang (~7%/bulan).',
    minPaymentPercent: 24 // Estimasi cicilan per bulan (~24% dari pokok per bulan)
  }
];
