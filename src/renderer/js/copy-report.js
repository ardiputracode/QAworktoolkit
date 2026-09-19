/**
 * copy-report.js
 *
 * LOGIC:
 * Menangani tombol dengan data-action="copy-report".
 *
 * Clipboard akan diisi 2 format:
 * - text/html   : dipakai oleh Outlook/Thunderbird sebagai tampilan email.
 * - text/plain  : berisi HTML code, dipakai oleh Notepad.
 */

(() => {
  const STATUS_CLEAR_DELAY = 7000;

  // Simpan timer per status element agar tidak bertumpuk.
  const statusTimers = new WeakMap();

  /**
   * Menampilkan pesan status sementara.
   */
  const showStatus = (statusElement, message) => {
    if (!statusElement) return;

    statusElement.innerHTML = message;

    const previousTimer = statusTimers.get(statusElement);
    if (previousTimer) {
      clearTimeout(previousTimer);
    }

    const timer = setTimeout(() => {
      statusElement.innerHTML = '';
    }, STATUS_CLEAR_DELAY);

    statusTimers.set(statusElement, timer);
  };

  /**
   * Mengambil konten dari target copy.
   *
   * - Jika target adalah textarea/input, ambil value.
   * - Jika target adalah div/container, ambil innerHTML.
   */
  const getCopyContent = (targetSelector) => {
    const target = document.querySelector(targetSelector);

    if (!target) {
      return {
        content: '',
        isRichHtml: false,
      };
    }

    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
      return {
        content: target.value || '',
        isRichHtml: false,
      };
    }

    return {
      content: target.innerHTML.trim(),
      isRichHtml: true,
    };
  };

  /**
   * Copy menggunakan Clipboard API modern.
   */
  const copyWithClipboardApi = async (content, isRichHtml) => {
    // Untuk textarea/plain output, cukup copy sebagai text biasa.
    if (!isRichHtml) {
      await navigator.clipboard.writeText(content);
      return;
    }

    // Untuk preview email, copy sebagai HTML dan plain HTML code.
    const htmlBlob = new Blob([content], { type: 'text/html' });
    const plainBlob = new Blob([content], { type: 'text/plain' });

    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': plainBlob,
      }),
    ]);
  };

  /**
   * Fallback untuk browser lama atau kondisi Clipboard API tidak tersedia.
   *
   * Catatan:
   * Fallback ini hanya bisa memastikan konten tercopy sebagai plain text.
   * Jadi hasil paste kemungkinan berupa HTML code, bukan tampilan email.
   */
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

  /**
   * Event delegation untuk semua tombol copy-report.
   */
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action="copy-report"]');

    if (!button) return;

    const statusElement = button.dataset.statusTarget
      ? document.querySelector(button.dataset.statusTarget)
      : null;

    const { content, isRichHtml } = getCopyContent(button.dataset.copyTarget);

    if (!content) {
      showStatus(statusElement, 'Belum ada konten yang bisa dicopy.');
      return;
    }

    button.disabled = true;
    button.setAttribute('aria-busy', 'true');

    try {
      const canUseClipboardApi = navigator.clipboard && (!isRichHtml || window.ClipboardItem);

      if (canUseClipboardApi) {
        await copyWithClipboardApi(content, isRichHtml);
      } else {
        copyPlainFallback(content);
      }

      window.showInfoDialog(
        'Copied!',
        `Paste into <strong>Outlook Web or Outlook App</strong> using <strong>Keep Source Formatting</strong>.
  <br>
  Right-click → Paste Options → <strong>Keep Source Formatting</strong>
  <br>
  💡 Tip: Set it as your default paste option for faster pasting next time.`
      );
    } catch (error) {
      try {
        copyPlainFallback(content);

        showStatus(
          statusElement,
          'Clipboard modern tidak tersedia. Konten dicopy sebagai HTML code.'
        );
      } catch {
        showStatus(statusElement, 'Gagal copy. Silakan coba lagi.');
      }
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });
})();
