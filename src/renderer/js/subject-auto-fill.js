const SubjectAutoFill = (function () {
  // 1. Private Selectors
  const SELECTORS = {
    INPUT_DATE: '#report-date',
    SELECT_PROJECT: '#project-name',
    SELECT_TYPE: '#project-type',
    INPUT_UPD: '#update-number',
    TARGET_MONTHLY: '#subject-preview-monthly',
    TARGET_DATE: '#subject-preview-date',
    TARGET_WEEKLY: '#subject-preview-week',
  };

  // 2. Private Variables
  let elements = {};
  let isInitialized = false;

  // 3. Private Methods

  const _parseDateSafe = (dateString) => {
    const [year, month, day] = dateString.split('-').map((num) => parseInt(num, 10));
    return new Date(year, month - 1, day);
  };

  const _getWeekOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    const firstMondayOffset = dayOfWeek === 1 ? 0 : dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const firstMondayDate = new Date(year, month, 1 + firstMondayOffset);
    const secondMondayDate = new Date(firstMondayDate);
    secondMondayDate.setDate(firstMondayDate.getDate() + 7);

    if (date < secondMondayDate) return 1;

    const diffTime = Math.abs(date - secondMondayDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 2;
  };

  /**
   * FUNGSI: _syncButtonStates
   * Mengecek semua tombol copy dan men-disable jika targetnya kosong.
   */
  const _syncButtonStates = () => {
    // Cari semua tombol yang punya atribut data-action="copy-subject"
    const copyButtons = document.querySelectorAll('[data-action="copy-subject"]');

    copyButtons.forEach((button) => {
      const targetSelector = button.dataset.copyTarget;
      const targetEl = document.querySelector(targetSelector);

      if (targetEl) {
        // Cek apakah nilainya kosong setelah di-trim
        const isEmpty = targetEl.value.trim() === '';
        // Set properti disabled berdasarkan kondisi isEmpty
        button.disabled = isEmpty;

        // Tambahan: Memberi efek visual agar terlihat benar-benar mati (opacity rendah)
        if (isEmpty) {
          button.style.opacity = '0.5';
          button.style.pointerEvents = 'none'; // Mencegah klik meski di beberapa browser
        } else {
          button.style.opacity = '1';
          button.style.pointerEvents = 'auto';
        }
      }
    });
  };

  const _updateSubject = () => {
    const projectName = elements.selectProject?.value;
    const projectType = elements.selectType?.value;
    const dateValue = elements.inputDate?.value;
    const updValue = elements.inputUpd?.value.trim();

    const isDateSet = !!dateValue;
    const isProjectSet = projectName !== '';
    const isTypeSet = projectType !== '';

    if (!isDateSet || !isProjectSet || !isTypeSet) {
      elements.targetMonthly.value = '';
      elements.targetDate.value = '';
      elements.targetWeekly.value = '';
      _syncButtonStates(); // Panggil sync saat data dikosongkan
      return;
    }

    const date = _parseDateSafe(dateValue);
    const monthName = date.toLocaleString('en-US', { month: 'long' });
    const fullDateString = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const weekNumber = _getWeekOfMonth(date);

    const typeWithUpd = updValue ? `${projectType}${updValue}` : projectType;

    elements.targetMonthly.value = `[Audio QA][${projectName}][${typeWithUpd}] Project Status Report [${monthName}]`;
    elements.targetDate.value = `[Audio QA][${projectName}][${typeWithUpd}] Project Status Report ${fullDateString}`;
    elements.targetWeekly.value = `[Audio QA][${projectName}][${typeWithUpd}] Project Status Report [${monthName}][Week ${weekNumber}]`;

    // Setelah nilai di-update, sinkronkan status tombol
    _syncButtonStates();
  };

  /**
   * FUNGSI: _setupCopyListeners
   * Menangani aksi klik tombol "Copy" dengan fitur Debounce (mencegah spam)
   * dan manajemen class visual 'is-copied'.
   */
  const _setupCopyListeners = () => {
    document.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-action="copy-subject"]');

      // --- DEBOUNCE LOGIC ---
      // Jika tombol tidak ada, atau tombol sedang dalam status 'is-copied',
      // langsung berhenti agar user tidak bisa spam klik.
      if (!button || button.classList.contains('is-copied')) return;

      const targetSelector = button.dataset.copyTarget;
      const targetEl = document.querySelector(targetSelector);
      if (!targetEl) return;

      const textToCopy =
        targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA'
          ? targetEl.value
          : targetEl.innerText;

      // Simpan teks asli untuk dikembalikan nanti
      const originalText = button.textContent.trim();

      try {
        // Proses menyalin ke clipboard
        await navigator.clipboard.writeText(textToCopy);

        // 1. Set status sukses: Ubah label DAN tambah class 'is-copied'
        button.textContent = 'Copied!';
        button.classList.add('is-copied');

        // 2. Tunggu 0.3 detik, lalu kembalikan ke keadaan semula
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('is-copied'); // Hapus class agar bisa diklik lagi
        }, 300);
      } catch (err) {
        console.error('Gagal menyalin teks: ', err);
        const errorText = 'Error!';
        button.textContent = errorText;
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    });
  };

  // 4. Public Methods
  return {
    init: function () {
      if (isInitialized) return;

      elements = {
        inputDate: document.querySelector(SELECTORS.INPUT_DATE),
        selectProject: document.querySelector(SELECTORS.SELECT_PROJECT),
        selectType: document.querySelector(SELECTORS.SELECT_TYPE),
        inputUpd: document.querySelector(SELECTORS.INPUT_UPD),
        targetMonthly: document.querySelector(SELECTORS.TARGET_MONTHLY),
        targetDate: document.querySelector(SELECTORS.TARGET_DATE),
        targetWeekly: document.querySelector(SELECTORS.TARGET_WEEKLY),
      };

      if (elements.inputDate) elements.inputDate.addEventListener('change', _updateSubject);
      if (elements.selectProject) elements.selectProject.addEventListener('change', _updateSubject);
      if (elements.selectType) elements.selectType.addEventListener('change', _updateSubject);
      if (elements.inputUpd) elements.inputUpd.addEventListener('input', _updateSubject);

      _setupCopyListeners();

      if (elements.inputUpd) {
        const observerContainer = elements.inputUpd.closest('.form-field');
        if (observerContainer) {
          const observer = new MutationObserver(() => _updateSubject());
          observer.observe(observerContainer, { attributes: true });
        }
      }

      _updateSubject(); // Menjalankan update awal
      _syncButtonStates(); // Memastikan tombol mati/hidup saat halaman pertama dimuat
      isInitialized = true;
      console.info('[SubjectAutoFill] 🚀 Module initialized with Sync States.');
    },
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  SubjectAutoFill.init();
});
