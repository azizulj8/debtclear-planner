import Papa from 'papaparse';
import { bulkAddDebts } from '../utils/storage.js';
import { formatRupiah } from '../utils/format.js';

export function renderCsvImport(container, onImportSuccess) {
  // Check if we need to insert the trigger button in some specific container
  // Or append it. We will render a dialog modal.
  const modalHTML = `
    <div class="modal-overlay" id="csv-modal">
      <div class="modal-box" style="max-width: 650px;">
        <div class="modal-header">
          <h3>Import Data Utang via CSV</h3>
          <button type="button" class="modal-close" id="csv-modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p class="text-secondary mb-4" style="font-size: var(--font-size-sm);">
            Unggah file CSV dengan format kolom yang sesuai untuk memasukkan data secara massal. 
            <a href="/template-utang.csv" download class="text-primary" style="font-weight:600; text-decoration:underline;">Unduh Template CSV</a>
          </p>

          <div class="csv-dropzone" id="csv-dropzone">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-2" style="opacity: 0.6;">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p style="font-weight: 500;">Tarik file CSV ke sini atau klik untuk memilih</p>
            <input type="file" id="csv-file-input" accept=".csv" style="display: none;" />
          </div>

          <div id="csv-preview-container" class="mt-4" style="display: none;">
            <h4 class="mb-2">Pratinjau Data</h4>
            <div style="overflow-x: auto; max-height: 250px; border: 1px solid var(--color-border); border-radius: var(--radius-md);">
              <table class="csv-preview-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: var(--font-size-sm);">
                <thead>
                  <tr style="background-color: var(--color-surface-hover); border-bottom: 1px solid var(--color-border);">
                    <th style="padding: var(--spacing-2);"><input type="checkbox" id="csv-select-all" checked /></th>
                    <th style="padding: var(--spacing-2);">Nama</th>
                    <th style="padding: var(--spacing-2);">Jenis</th>
                    <th style="padding: var(--spacing-2);">Pokok</th>
                    <th style="padding: var(--spacing-2);">Bunga</th>
                    <th style="padding: var(--spacing-2);">Cicilan Min</th>
                    <th style="padding: var(--spacing-2);">JT</th>
                  </tr>
                </thead>
                <tbody id="csv-preview-body"></tbody>
              </table>
            </div>
            <div id="csv-error-report" class="mt-2 text-danger" style="font-size: var(--font-size-xs); display: none;"></div>
            <div class="flex gap-4 mt-4">
              <button type="button" class="btn btn--primary flex-1" id="btn-submit-csv-import" disabled>Import Terpilih</button>
              <button type="button" class="btn btn--secondary flex-1" id="btn-cancel-csv-import">Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Append modal to body if not already present
  let modal = document.getElementById('csv-modal');
  if (modal) {
    modal.remove();
  }
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  modal = document.getElementById('csv-modal');

  const closeBtn = modal.querySelector('#csv-modal-close');
  const dropzone = modal.querySelector('#csv-dropzone');
  const fileInput = modal.querySelector('#csv-file-input');
  const previewContainer = modal.querySelector('#csv-preview-container');
  const previewBody = modal.querySelector('#csv-preview-body');
  const errorReport = modal.querySelector('#csv-error-report');
  const submitBtn = modal.querySelector('#btn-submit-csv-import');
  const cancelBtn = modal.querySelector('#btn-cancel-csv-import');
  const selectAllCheckbox = modal.querySelector('#csv-select-all');

  let parsedDebts = [];

  const closeModal = () => {
    modal.classList.remove('active');
    resetImport();
  };

  const resetImport = () => {
    fileInput.value = '';
    previewContainer.style.display = 'none';
    previewBody.innerHTML = '';
    errorReport.style.display = 'none';
    errorReport.innerHTML = '';
    parsedDebts = [];
    submitBtn.disabled = true;
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  dropzone.addEventListener('click', () => fileInput.click());
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('csv-dropzone--drag');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('csv-dropzone--drag');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('csv-dropzone--drag');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  const handleFile = (file) => {
    errorReport.style.display = 'none';
    errorReport.innerHTML = '';
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        const errors = [];
        parsedDebts = [];

        rows.forEach((row, index) => {
          const rowNum = index + 2; // +1 for 0-index, +1 for header row
          
          // Map headers (case insensitive / normalized)
          const name = row['Nama Utang'] || row['name'] || '';
          const type = row['Jenis Utang'] || row['type'] || '';
          const principal = parseFloat((row['Sisa Pokok'] || row['principal'] || '0').toString().replace(/[^0-9.-]/g, ''));
          const interest = parseFloat((row['Bunga Pertahun (%)'] || row['interestRate'] || row['interest_rate'] || '0').toString().replace(/[^0-9.-]/g, ''));
          const minPayment = parseFloat((row['Cicilan Minimum'] || row['minPayment'] || row['min_payment'] || '0').toString().replace(/[^0-9.-]/g, ''));
          const dueDate = parseInt((row['Tanggal Jatuh Tempo'] || row['dueDate'] || row['due_date'] || '15').toString().replace(/[^0-9]/g, ''), 10);

          // Validation
          const rowErrors = [];
          if (!name.trim()) rowErrors.push('Nama kosong');
          
          const validTypes = ['Pinjaman Online', 'KPR', 'Kartu Kredit', 'Leasing/KKB', 'KTA', 'Lainnya'];
          if (!validTypes.includes(type)) {
            rowErrors.push(`Jenis utang tidak valid (harus salah satu dari: ${validTypes.join(', ')})`);
          }
          if (isNaN(principal) || principal <= 0) rowErrors.push('Sisa Pokok harus > 0');
          if (isNaN(interest) || interest < 0 || interest > 100) rowErrors.push('Bunga harus 0-100');
          if (isNaN(minPayment) || minPayment <= 0) rowErrors.push('Cicilan Minimum harus > 0');
          if (isNaN(dueDate) || dueDate < 1 || dueDate > 31) rowErrors.push('Tanggal Jatuh Tempo harus 1-31');

          if (rowErrors.length > 0) {
            errors.push(`Baris ${rowNum}: ${rowErrors.join(', ')}`);
          } else {
            parsedDebts.push({
              index,
              name: name.trim(),
              type,
              principal,
              interestRate: interest,
              minPayment,
              dueDate
            });
          }
        });

        if (errors.length > 0) {
          errorReport.style.display = 'block';
          errorReport.innerHTML = `<strong>Ditemukan kesalahan parsing:</strong><br/>` + errors.map(e => `• ${e}`).join('<br/>');
        }

        renderPreview();
      },
      error: (err) => {
        alert('Gagal mengurai file CSV: ' + err.message);
      }
    });
  };

  const renderPreview = () => {
    previewBody.innerHTML = '';
    if (parsedDebts.length === 0) {
      previewContainer.style.display = 'none';
      return;
    }

    previewContainer.style.display = 'block';
    parsedDebts.forEach(d => {
      previewBody.innerHTML += `
        <tr style="border-bottom: 1px solid var(--color-border);">
          <td style="padding: var(--spacing-2);"><input type="checkbox" class="csv-row-checkbox" data-index="${d.index}" checked /></td>
          <td style="padding: var(--spacing-2); font-weight:600;">${d.name}</td>
          <td style="padding: var(--spacing-2); font-size:var(--font-size-xs);">${d.type}</td>
          <td style="padding: var(--spacing-2);">${formatRupiah(d.principal)}</td>
          <td style="padding: var(--spacing-2);">${d.interestRate}%</td>
          <td style="padding: var(--spacing-2);">${formatRupiah(d.minPayment)}</td>
          <td style="padding: var(--spacing-2);">${d.dueDate}</td>
        </tr>
      `;
    });

    submitBtn.disabled = false;
    setupPreviewListeners();
  };

  const setupPreviewListeners = () => {
    const rowCheckboxes = previewBody.querySelectorAll('.csv-row-checkbox');
    
    selectAllCheckbox.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      rowCheckboxes.forEach(cb => cb.checked = isChecked);
      updateSubmitButtonState();
    });

    rowCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        updateSubmitButtonState();
        // check if all are checked
        const allChecked = Array.from(rowCheckboxes).every(r => r.checked);
        selectAllCheckbox.checked = allChecked;
      });
    });
  };

  const updateSubmitButtonState = () => {
    const anyChecked = Array.from(previewBody.querySelectorAll('.csv-row-checkbox')).some(r => r.checked);
    submitBtn.disabled = !anyChecked;
  };

  cancelBtn.addEventListener('click', resetImport);

  submitBtn.addEventListener('click', async () => {
    const selectedIndices = Array.from(previewBody.querySelectorAll('.csv-row-checkbox:checked'))
      .map(cb => parseInt(cb.getAttribute('data-index'), 10));

    const selectedDebts = parsedDebts.filter(d => selectedIndices.includes(d.index)).map(d => {
      return {
        name: d.name,
        type: d.type,
        principal: d.principal,
        interestRate: d.interestRate,
        minPayment: d.minPayment,
        dueDate: d.dueDate
      };
    });

    if (selectedDebts.length > 0) {
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengimport...';
        await bulkAddDebts(selectedDebts);
        closeModal();
        if (onImportSuccess) onImportSuccess();
      } catch (err) {
        console.error('Failed to bulk import:', err);
        alert('Gagal mengimport data utang.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Import Terpilih';
      }
    }
  });

  // Expose trigger open
  return {
    open: () => {
      modal.classList.add('active');
    }
  };
}
