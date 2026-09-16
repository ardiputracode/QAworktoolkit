/**
 * copy-description.js
 *
 * LOGIC:
 * 1. Menyalin konten textarea sebagai plain text saat diklik.
 * 2. Memantau (watch) isi target secara berkala untuk update status disabled tombol.
 */
(() => {
  const STATUS_CLEAR_DELAY = 3000;
  const statusTimers = new WeakMap();

  const showStatus = (statusElement, message) => {
    if (!statusElement) return;
    statusElement.innerHTML = message;
    const previousTimer = statusTimers.get(statusElement);
    if (previousTimer) clearTimeout(previousTimer);
    const timer = setTimeout(() => {
      statusElement.innerHTML = '';
    }, STATUS_CLEAR_DELAY);
    statusTimers.set(statusElement, timer);
  };

  const getPlainTextContent = (targetSelector) => {
    const target = document.querySelector(targetSelector);
    if (!target) return '';
    return target.tagName === 'TEXTAREA' || target.tagName === 'INPUT'
      ? target.value.trim()
      : target.innerText.trim();
  };

  const copyPlainFallback = (content) => {
    const textarea = document.createElement('textarea');
    textarea.value = content;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  };

  // --- FITUR TAMBAHAN: SMART STATE WATCHER ---
  // Karena perubahan .value via JS tidak trigger event 'input',
  // kita gunakan interval kecil untuk mengecek apakah konten sudah ada.
  setInterval(() => {
    const copyButtons = document.querySelectorAll('[data-action="copy-description"]');
    copyButtons.forEach((btn) => {
      const content = getPlainTextContent(btn.dataset.copyTarget);
      // Tombol akan disabled jika konten kosong
      btn.disabled = content === '';
      // Opsional: Tambah sedikit transparansi jika disabled
      btn.style.opacity = btn.disabled ? '0.5' : '1';
      btn.style.cursor = btn.disabled ? 'not-allowed' : 'pointer';
    });
  }, 1000); // Cek setiap 1 detik

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action="copy-description"]');
    if (!button) return;

    const statusElement = button.dataset.statusTarget
      ? document.querySelector(button.dataset.statusTarget)
      : null;

    const content = getPlainTextContent(button.dataset.copyTarget);

    if (!content) {
      showStatus(
        statusElement,
        '<span style="color: var(--text-muted)">Belum ada konten untuk dicopy.</span>'
      );
      return;
    }

    button.disabled = true;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
        showStatus(statusElement, '<strong>Copied to clipboard!</strong>');
      } else {
        copyPlainFallback(content);
        showStatus(statusElement, '<strong>Copied!</strong> (Fallback)');
      }
    } catch (error) {
      copyPlainFallback(content);
      showStatus(statusElement, '<strong>Copied!</strong> (Fallback)');
    } finally {
      // Kita tidak mengembalikan btn.disabled = false di sini
      // karena sudah dihandle oleh setInterval di atas.
    }
  });
})();
