import html2pdf from 'html2pdf.js';
import { formatRupiah } from './format.js';

export function exportToPdf(debts, strategy, extraPayment, payoffData) {
  const { schedule, totalInterest, months, isInfinite } = payoffData;

  if (isInfinite || !schedule || schedule.length === 0) {
    alert('Simulasi tidak dapat diexport karena status tidak valid atau kosong.');
    return;
  }

  // Get active chart image as static data URL to embed in PDF
  let chartImgSrc = '';
  if (window.activeTimelineChart) {
    chartImgSrc = window.activeTimelineChart.toDataURL('image/png');
  }

  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const totalPrincipal = debts.reduce((sum, d) => sum + (d.isPaidOff ? 0 : d.principal), 0);
  const freeDebtDate = schedule[schedule.length - 1].month;

  // Build the print content
  const printDiv = document.createElement('div');
  printDiv.id = 'pdf-print-template';
  printDiv.style.padding = '40px';
  printDiv.style.fontFamily = 'Inter, sans-serif';
  printDiv.style.color = '#333';
  printDiv.style.backgroundColor = '#fff';

  printDiv.innerHTML = `
    <!-- Header -->
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #0f9d58; padding-bottom:15px; margin-bottom:25px;">
      <div>
        <h1 style="color:#0f9d58; margin:0; font-size:24px; font-weight:800;">DebtClear</h1>
        <p style="margin:2px 0 0 0; font-size:12px; color:#666;">Rencana Pelunasan Utang Personal</p>
      </div>
      <div style="text-align:right;">
        <p style="margin:0; font-size:12px; color:#555;">Dibuat Tanggal</p>
        <strong style="font-size:13px;">${currentDateStr}</strong>
      </div>
    </div>

    <!-- Overview Metrics Grid -->
    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:15px; margin-bottom:30px;">
      <div style="border:1px solid #ddd; border-radius:8px; padding:12px; background-color:#fcfcfc;">
        <span style="font-size:11px; color:#666; text-transform:uppercase;">Total Utang Pokok</span>
        <h3 style="margin:5px 0 0 0; color:#0f9d58; font-size:18px;">${formatRupiah(totalPrincipal)}</h3>
      </div>
      <div style="border:1px solid #ddd; border-radius:8px; padding:12px; background-color:#fcfcfc;">
        <span style="font-size:11px; color:#666; text-transform:uppercase;">Tanggal Bebas Utang</span>
        <h3 style="margin:5px 0 0 0; color:#0f9d58; font-size:18px;">${freeDebtDate}</h3>
      </div>
      <div style="border:1px solid #ddd; border-radius:8px; padding:12px; background-color:#fcfcfc;">
        <span style="font-size:11px; color:#666; text-transform:uppercase;">Total Anggaran Bunga</span>
        <h3 style="margin:5px 0 0 0; color:#db4455; font-size:18px;">${formatRupiah(totalInterest)}</h3>
      </div>
    </div>

    <div style="margin-bottom:25px;">
      <span style="font-size:12px; color:#555;">Strategi Terpilih: </span>
      <strong style="text-transform: capitalize;">Method ${strategy}</strong>
      <span style="font-size:12px; color:#555; margin-left:15px;">Waktu Pelunasan: </span>
      <strong>${months} Bulan</strong>
      ${extraPayment > 0 ? `<span style="font-size:12px; color:#555; margin-left:15px;">Anggaran Tambahan (Snowflake): </span><strong>${formatRupiah(extraPayment)} / bulan</strong>` : ''}
    </div>

    <!-- Chart Image Section -->
    ${chartImgSrc ? `
      <div style="text-align:center; margin-bottom:35px; border:1px solid #eee; padding:10px; border-radius:8px;">
        <h4 style="margin:0 0 10px 0; font-size:14px; text-align:left; color:#444;">Grafik Proyeksi Saldo</h4>
        <img src="${chartImgSrc}" style="max-width:100%; height:220px; object-fit:contain;" />
      </div>
    ` : ''}

    <!-- Debts List Table -->
    <div style="margin-bottom:30px;">
      <h3 style="border-bottom:1px solid #eee; padding-bottom:8px; margin-bottom:12px; font-size:15px; color:#222;">Rincian Daftar Utang</h3>
      <table style="width:100%; border-collapse:collapse; text-align:left; font-size:12px;">
        <thead>
          <tr style="border-bottom:2px solid #eee; background-color:#fafafa;">
            <th style="padding:8px;">Nama Utang</th>
            <th style="padding:8px;">Jenis</th>
            <th style="padding:8px; text-align:right;">Sisa Pokok</th>
            <th style="padding:8px; text-align:right;">Bunga</th>
            <th style="padding:8px; text-align:right;">Cicilan Min</th>
            <th style="padding:8px; text-align:center;">Jatuh Tempo</th>
          </tr>
        </thead>
        <tbody>
          ${debts.map(d => `
            <tr style="border-bottom:1px solid #f0f0f0; ${d.isPaidOff ? 'opacity:0.5;' : ''}">
              <td style="padding:8px; font-weight:600;">${d.name}</td>
              <td style="padding:8px; font-size:11px;">${d.type}</td>
              <td style="padding:8px; text-align:right;">${formatRupiah(d.principal)}</td>
              <td style="padding:8px; text-align:right;">${d.interestRate}%/thn</td>
              <td style="padding:8px; text-align:right;">${formatRupiah(d.minPayment)}</td>
              <td style="padding:8px; text-align:center;">Tgl ${d.dueDate}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Watermark / Footer -->
    <div style="text-align:center; font-size:10px; color:#aaa; margin-top:50px; border-top:1px solid #f0f0f0; padding-top:15px; position:relative;">
      <p style="margin:0;">Dokumen ini digenerate secara otomatis oleh <strong>DebtClear Planner</strong>.</p>
      <p style="margin:2px 0 0 0; font-size:9px;">Semua data disimpan secara lokal pada perangkat Anda.</p>
      
      <!-- Watermark text -->
      <div style="position:absolute; top:-120px; left:50%; transform:translateX(-50%) rotate(-15deg); font-size:36px; font-weight:900; color:rgba(0,0,0,0.03); white-space:nowrap; pointer-events:none; letter-spacing:5px;">
        DEBTCLEAR FREE VERSION
      </div>
    </div>
  `;

  // html2pdf options
  const opt = {
    margin:       10,
    filename:     `DebtClear_Rencana_Pelunasan_${new Date().toISOString().slice(0,10)}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Convert to PDF and download
  html2pdf().from(printDiv).set(opt).save().catch(err => {
    console.error('PDF export failed:', err);
    alert('Gagal mengekspor rencana pelunasan ke PDF.');
  });
}
