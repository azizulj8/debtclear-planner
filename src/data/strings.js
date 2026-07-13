export const STRINGS = {
  APP_NAME: 'DebtClear',

  // Landing Page
  LANDING_HERO_TITLE: 'Bebas Utang Lebih Cepat',
  LANDING_HERO_SUBTITLE:
    'Susun strategi cerdas untuk melunasi pinjol dan utang lainnya. Hemat bunga, hemat waktu, tanpa stres.',
  LANDING_CTA_BUTTON: 'Mulai Sekarang — Gratis',
  LANDING_PRIVACY_NOTE:
    'Tanpa daftar akun · 100% anonim · Semua data tersimpan di perangkatmu, bukan di server kami',

  LANDING_FEATURES_TITLE: 'Kenapa Memilih DebtClear?',
  LANDING_FEATURE_1_TITLE: 'Strategi Cerdas',
  LANDING_FEATURE_1_DESC: 'Otomatis bandingkan metode Snowball dan Avalanche untuk hasil optimal.',
  LANDING_FEATURE_2_TITLE: 'Visualisasi Timeline',
  LANDING_FEATURE_2_DESC: 'Lihat dengan jelas kapan Anda akan bebas dari semua utang.',
  LANDING_FEATURE_3_TITLE: 'Push Reminder',
  LANDING_FEATURE_3_DESC: 'Tidak perlu takut telat bayar cicilan dengan pengingat otomatis.',

  LANDING_HOW_IT_WORKS_TITLE: 'Bagaimana Cara Kerjanya?',
  LANDING_STEP_1_TITLE: 'Masukkan Data Utang',
  LANDING_STEP_1_DESC: 'Catat semua utang Anda dengan aman. Tersedia template untuk pinjol.',
  LANDING_STEP_2_TITLE: 'Pilih Strategi',
  LANDING_STEP_2_DESC: 'Sistem akan mensimulasikan rute tercepat dan termurah untuk lunas.',
  LANDING_STEP_3_TITLE: 'Ikuti Rencana',
  LANDING_STEP_3_DESC: 'Bayar cicilan sesuai panduan dan rasakan progressnya setiap bulan.',

  LANDING_FOOTER_COPYRIGHT: '© 2026 DebtClear Planner. Hak Cipta Dilindungi.',

  // Debt Form
  FORM_ADD_DEBT_TITLE: 'Tambah Utang Baru',
  FORM_LABEL_NAME: 'Nama Utang (mis: Pinjol A, KPR)',
  FORM_LABEL_TYPE: 'Jenis Utang',
  FORM_LABEL_PRINCIPAL: 'Sisa Pokok (Rp)',
  FORM_LABEL_INTEREST: 'Bunga Tahunan (%)',
  FORM_LABEL_MIN_PAYMENT: 'Cicilan Minimum (Rp)',
  FORM_LABEL_DUE_DATE: 'Tanggal Jatuh Tempo (1-31)',
  FORM_LABEL_TENOR: 'Tenor (bulan) — opsional',
  FORM_LABEL_PRIOR_PAYMENTS: 'Cicilan yang sudah dibayar sebelum dicatat — opsional',
  FORM_BTN_SAVE: 'Simpan',
  FORM_BTN_CANCEL: 'Batal',

  // Validation Errors
  ERR_REQUIRED_NAME: 'Nama utang tidak boleh kosong.',
  ERR_MAX_LENGTH_NAME: 'Nama utang maksimal 100 karakter.',
  ERR_REQUIRED_TYPE: 'Silakan pilih jenis utang.',
  ERR_INVALID_PRINCIPAL: 'Sisa pokok harus berupa angka lebih dari 0.',
  ERR_INVALID_INTEREST: 'Bunga tahunan harus berupa angka 0-600.',
  ERR_INVALID_MIN_PAYMENT: 'Cicilan minimum harus berupa angka lebih dari 0.',
  ERR_INVALID_DUE_DATE: 'Tanggal jatuh tempo harus antara 1-31.',
  ERR_INVALID_TENOR: 'Tenor harus berupa angka bulan antara 1-600.',
  ERR_INVALID_PRIOR_PAYMENTS: 'Jumlah cicilan terbayar harus 0 atau lebih, dan kurang dari tenor.',

  // Debt List
  LIST_TITLE: 'Daftar Utang Anda',
  LIST_TOTAL_DEBT: 'Total Utang',
  LIST_EMPTY_STATE: 'Belum ada utang yang tercatat.',
  LIST_EMPTY_CTA: 'Tambah Utang Pertama Anda',
  LIST_BTN_EDIT: 'Edit',
  LIST_BTN_DELETE: 'Hapus',
  LIST_CONFIRM_DELETE: 'Apakah Anda yakin ingin menghapus utang "{name}"?',
  LIST_SORT_LABEL: 'Urutkan berdasarkan',
  LIST_SORT_BY_NAME_ASC: 'Nama (A-Z)',
  LIST_SORT_BY_NAME_DESC: 'Nama (Z-A)',
  LIST_SORT_BY_PRINCIPAL_DESC: 'Sisa Pokok Terbesar',
  LIST_SORT_BY_PRINCIPAL_ASC: 'Sisa Pokok Terkecil',
  LIST_SORT_BY_INTEREST_DESC: 'Bunga Tertinggi',
  LIST_SORT_BY_INTEREST_ASC: 'Bunga Terendah',
  LIST_SORT_BY_DUE_DATE: 'Tanggal Jatuh Tempo',
  LIST_LABEL_INTEREST: 'Bunga',
  LIST_LABEL_MIN_PAYMENT: 'Cicilan Min',
  LIST_LABEL_DUE_DATE: 'Jatuh Tempo tgl',
  LIST_BADGE_LUNAS: 'Lunas',
  LIST_BTN_ADD: 'Tambah Utang',
};
