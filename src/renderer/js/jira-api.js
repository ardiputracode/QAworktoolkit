/**
 * jira-api.js
 * JIRA API INTERFACE MODULE (Module Version)
 */

import { showToast } from './toast-notification.js';

const LEGACY_USERNAME_MARKER = 'as: ';
const ALLOWED_AVATAR_HOSTS = ['atlassian.com', 'atlassian.net', 'atl-paas.net'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- [NEW] Konfigurasi field auto-count (Total Issues & Major Issues) ---
const ISSUE_COUNT_FIELDS = [
  {
    linkInputId: 'total-issues-link',
    countInputId: 'total-issues',
    fetchedAtId: 'total-issues-fetched-at',
    refreshSelector: '[data-action="refresh-total-issues"]',
  },
  {
    linkInputId: 'major-issues-link',
    countInputId: 'major-issues',
    fetchedAtId: 'major-issues-fetched-at',
    refreshSelector: '[data-action="refresh-major-issues"]',
  },
];

function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Parse URL filter Jira menjadi { siteBaseUrl, jql, filterId }.
 * Mendukung URL seperti:
 *   https://namaperusahaan.atlassian.net/issues/?jql=project%3DABC
 *   https://namaperusahaan.atlassian.net/issues/?filter=12345
 * Mengembalikan null jika bukan URL https yang valid atau tidak mengandung
 * parameter jql/filter sama sekali.
 */
function parseJiraFilterInput(rawUrl) {
  if (!rawUrl) return null;
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;

  const jql = parsed.searchParams.get('jql');
  const filterId = parsed.searchParams.get('filter');
  if (!jql && !filterId) return null;

  return {
    siteBaseUrl: `${parsed.protocol}//${parsed.hostname}`,
    jql,
    filterId,
  };
}

function formatFetchedAt(date) {
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // --- REFERENSI ELEMEN ---
  const jiraForm = document.getElementById('jira-settings-form');
  const emailInput = document.getElementById('jira-email');
  const tokenInput = document.getElementById('jira-api-token');
  const testBtn = document.querySelector('[data-action="test-jira"]');
  const statusDiv = document.getElementById('jira-status');
  const userDisplay = document.getElementById('jira-connected-user');
  const avatarImg = document.getElementById('jira-avatar');
  const saveBtn = document.querySelector('[data-action="save-jira"]');
  const resetBtn = document.querySelector('[data-action="reset-jira"]');
  const connectionBanner = document.getElementById('jira-connection-banner');
  const refreshButtons = document.querySelectorAll(
    '[data-action="refresh-total-issues"], [data-action="refresh-major-issues"]'
  );

  // --- GUARD: Cek ketersediaan elemen ---
  const requiredElements = {
    'jira-settings-form': jiraForm,
    'jira-email': emailInput,
    'jira-api-token': tokenInput,
    '[data-action="test-jira"]': testBtn,
    'jira-status': statusDiv,
    'jira-connected-user': userDisplay,
    'jira-avatar': avatarImg,
    '[data-action="save-jira"]': saveBtn,
    '[data-action="reset-jira"]': resetBtn,
    'jira-connection-banner': connectionBanner,
  };

  const missing = Object.entries(requiredElements)
    .filter(([, el]) => !el)
    .map(([name]) => name);
  if (missing.length > 0) {
    console.error(`[jira-api] DOM element(s) tidak ditemukan: ${missing.join(', ')}`);
    return;
  }

  // --- HELPER FUNCTIONS ---

  function updateBanner(isVisible) {
    if (connectionBanner) {
      if (isVisible) {
        connectionBanner.removeAttribute('hidden');
      } else {
        connectionBanner.setAttribute('hidden', '');
      }
    }
  }

  function updateControlButtons(isConnected) {
    if (saveBtn) saveBtn.disabled = !isConnected;
    if (resetBtn) resetBtn.disabled = !isConnected;
    // --- [ADD] Tambahkan baris ini untuk men-disable tombol refresh jika tidak connected ---
    refreshButtons.forEach((btn) => (btn.disabled = !isConnected));
  }

  const STATUS_CLASSES = ['success', 'error', 'loading'];
  function setStatus(state, message) {
    STATUS_CLASSES.forEach((cls) => statusDiv.classList.remove(cls));
    if (state) statusDiv.classList.add(state);
    statusDiv.textContent = message;
  }

  function resetConnectedUser() {
    userDisplay.textContent = '-';
    avatarImg.removeAttribute('src');
    avatarImg.style.display = 'none';
  }

  function clearAvatar() {
    avatarImg.removeAttribute('src');
    avatarImg.style.display = 'none';
  }

  function isValidEmail(value) {
    return EMAIL_REGEX.test(value);
  }

  function extractUsername(result) {
    if (result.username) return result.username;
    if (result.message && result.message.includes(LEGACY_USERNAME_MARKER)) {
      return result.message.split(LEGACY_USERNAME_MARKER)[1].trim();
    }
    return null;
  }

  function isTrustedAvatarUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return false;
      return ALLOWED_AVATAR_HOSTS.some(
        (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
      );
    } catch {
      return false;
    }
  }

  // --- [NEW] DETEKSI PERUBAHAN INPUT (Dirty State) ---
  // Jika user mengubah email atau token, status koneksi langsung dianggap mati & banner muncul
  const handleInputChange = () => {
    updateControlButtons(false);
    updateBanner(true);
    setJiraConnected(false);
    console.info('[jira-api] Input changed: connection invalidated.');
  };

  emailInput.addEventListener('input', handleInputChange);
  tokenInput.addEventListener('input', handleInputChange);

  // --- [NEW] STATE KONEKSI (dipakai fitur auto-count) ---
  let isJiraConnected = false;
  function setJiraConnected(connected) {
    isJiraConnected = connected;
  }

  // --- LOGIKA UTAMA: AUTO CHECK ON STARTUP ---
  async function performStartupCheck() {
    const savedEmail = localStorage.getItem('jiraEmail');
    const savedToken = localStorage.getItem('jiraToken');

    if (savedEmail) emailInput.value = savedEmail;
    if (savedToken) tokenInput.value = savedToken;

    if (!savedEmail || !savedToken) {
      updateBanner(true);
      updateControlButtons(false);
      return;
    }

    try {
      const result = await window.qaToolkit.testJiraConnection({
        email: savedEmail,
        token: savedToken,
      });

      if (result && result.success) {
        // Jika sudah tersimpan dan valid saat startup, sembunyikan banner
        updateBanner(false);
        setStatus('success', '✅ Connected');
        updateControlButtons(true);
        userDisplay.textContent = extractUsername(result) || '-';
        if (result.avatarUrl && isTrustedAvatarUrl(result.avatarUrl)) {
          avatarImg.src = result.avatarUrl;
          avatarImg.style.display = 'block';
        }
        setJiraConnected(true);
        // Delay singkat supaya form autosave (report-builder-save-logic.js)
        // yang juga jalan di DOMContentLoaded sempat mengisi field link dulu.
        setTimeout(() => recheckAllIssueCountFields(), 300);
      } else {
        updateBanner(true);
        resetConnectedUser();
        updateControlButtons(false);
        setStatus('error', result?.message || '❌ Connection failed.');
        setJiraConnected(false);
      }
    } catch (err) {
      updateBanner(true);
      resetConnectedUser();
      updateControlButtons(false);
      setJiraConnected(false);
    }
  }

  performStartupCheck();

  // --- EVENT: Manual Test Connection ---
  jiraForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const token = tokenInput.value;

    if (!email || !token || !isValidEmail(email)) {
      setStatus('error', '⚠️ Invalid Email or Token');
      updateControlButtons(false);
      updateBanner(true);
      return;
    }

    setStatus('loading', '⏳ Testing connection...');
    testBtn.disabled = true;

    try {
      const result = await window.qaToolkit.testJiraConnection({ email, token });
      if (result && result.success) {
        // [MODIFIED] Banner TETAP MUNCUL jika sukses test tapi belum di-save
        updateBanner(true);
        setStatus('success', '✅ Connected');
        updateControlButtons(true); // Tombol save/reset aktif
        userDisplay.textContent = extractUsername(result) || '-';
        if (result.avatarUrl && isTrustedAvatarUrl(result.avatarUrl)) {
          avatarImg.src = result.avatarUrl;
          avatarImg.style.display = 'block';
        } else {
          clearAvatar();
        }
        setJiraConnected(true);
        recheckAllIssueCountFields();
      } else {
        updateBanner(true);
        setStatus('error', result?.message || '❌ Connection failed.');
        updateControlButtons(false);
        resetConnectedUser();
        setJiraConnected(false);
      }
    } catch (err) {
      updateBanner(true);
      setStatus('error', '❌ Connection failed.');
      updateControlButtons(false);
      resetConnectedUser();
      setJiraConnected(false);
    } finally {
      testBtn.disabled = false;
    }
  });

  // --- EVENT: Save Button ---
  saveBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const token = tokenInput.value;
    localStorage.setItem('jiraEmail', email);
    localStorage.setItem('jiraToken', token);

    // [MODIFIED] Banner baru hilang SETELAH data berhasil di-save ke storage
    updateBanner(false);

    showToast('Configuration saved successfully!', 'success');
    setStatus('success', '💾 Configuration saved locally!');
  });

  // --- EVENT: Reset Button ---
  resetBtn.addEventListener('click', () => {
    localStorage.removeItem('jiraEmail');
    localStorage.removeItem('jiraToken');
    emailInput.value = '';
    tokenInput.value = '';
    resetConnectedUser();
    setStatus('', 'Jira configuration cleared.');
    updateControlButtons(false);
    updateBanner(true);
    setJiraConnected(false);
    showToast('Configuration has been reset.', 'info');
  });

  // =====================================================================
  // --- [NEW] FITUR: AUTO-COUNT TOTAL ISSUES & MAJOR ISSUES DARI JIRA ---
  // =====================================================================
  //
  // Setiap field (Total Issues / Major Issues) disiapkan lewat
  // setupIssueCountField(). Fungsi ini mengembalikan { runFetch } yang bisa
  // dipanggil untuk (re-)fetch jumlah tiket dari URL filter Jira yang ada
  // di input link-nya, tapi hanya benar-benar melakukan request kalau:
  //   1. Jira sedang berstatus connected, DAN
  //   2. Field link berisi URL filter Jira yang valid (mengandung ?jql= atau ?filter=)
  //
  // Membutuhkan tambahan method di preload/main process (window.qaToolkit),
  // yaitu getJiraIssueCount({ email, token, siteBaseUrl, jql, filterId }) yang
  // mengembalikan { success: true, count: <number> } atau
  // { success: false, message: <string> }. Lihat catatan di akhir file.
  function setupIssueCountField(config) {
    const linkInput = document.getElementById(config.linkInputId);
    const countInput = document.getElementById(config.countInputId);
    const fetchedAtSpan = document.getElementById(config.fetchedAtId);
    const refreshBtn = document.querySelector(config.refreshSelector);

    if (!linkInput || !countInput || !fetchedAtSpan || !refreshBtn) {
      console.warn(
        `[jira-api] Elemen auto-count untuk "${config.linkInputId}" tidak lengkap, fitur ini dilewati.`
      );
      return null;
    }

    let lastFetchedUrl = null;

    // Pulihkan tampilan "Last fetched" dari cache lokal (tanpa fetch ulang),
    // supaya info-nya tidak hilang tiap kali app dibuka ulang.
    try {
      const cachedRaw = localStorage.getItem(`jiraIssueCount:${config.countInputId}`);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached && cached.url === linkInput.value.trim()) {
          lastFetchedUrl = cached.url;
          fetchedAtSpan.textContent = `${formatFetchedAt(new Date(cached.at))} (approx.)`;
        }
      }
    } catch {
      // Cache korup, abaikan saja.
    }

    async function runFetch({ force = false } = {}) {
      const rawUrl = linkInput.value.trim();
      if (!rawUrl || !isJiraConnected) return;

      const parsedFilter = parseJiraFilterInput(rawUrl);
      if (!parsedFilter) {
        fetchedAtSpan.textContent = 'URL filter tidak valid';
        return;
      }

      // Hindari fetch berulang untuk URL yang sama, kecuali refresh manual (force).
      if (!force && rawUrl === lastFetchedUrl) return;

      const originalBtnLabel = refreshBtn.textContent;
      refreshBtn.disabled = true;
      refreshBtn.textContent = '⏳';
      fetchedAtSpan.textContent = 'Fetching...';

      try {
        const result = await window.qaToolkit.getJiraIssueCount({
          email: emailInput.value.trim(),
          token: tokenInput.value,
          siteBaseUrl: parsedFilter.siteBaseUrl,
          jql: parsedFilter.jql,
          filterId: parsedFilter.filterId,
        });

        if (result && result.success && typeof result.count === 'number') {
          countInput.value = result.count;
          lastFetchedUrl = rawUrl;
          const now = new Date();
          fetchedAtSpan.textContent = `${formatFetchedAt(now)} (approx.)`;
          localStorage.setItem(
            `jiraIssueCount:${config.countInputId}`,
            JSON.stringify({ url: rawUrl, count: result.count, at: now.getTime() })
          );
        } else {
          fetchedAtSpan.textContent = 'Fetch gagal';
          showToast(
            result?.message || `Failed to fetch ${config.countInputId.replace('-', ' ')} count.`,
            'error'
          );
        }
      } catch (err) {
        console.error(`[jira-api] Gagal fetch issue count (${config.countInputId}):`, err);
        fetchedAtSpan.textContent = 'Fetch gagal';
        showToast('Failed to reach Jira to fetch ticket count.', 'error');
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = originalBtnLabel;
      }
    }

    refreshBtn.addEventListener('click', () => runFetch({ force: true }));

    return { runFetch };
  }

  const issueCountFields = ISSUE_COUNT_FIELDS.map(setupIssueCountField).filter(Boolean);

  function recheckAllIssueCountFields() {
    issueCountFields.forEach((field) => field.runFetch());
  }

  const debouncedRecheckAllIssueCountFields = debounce(recheckAllIssueCountFields, 600);

  // Delegasi di level document supaya menangkap dua kasus sekaligus:
  //   1. User mengetik/paste URL langsung ke field Total/Major Issues Link.
  //   2. Field terisi otomatis lewat autosave / open draft
  //      (report-builder-save-logic.js memanggil
  //      `form.dispatchEvent(new Event('input'))` setelah fillForm()).
  document.addEventListener('input', (event) => {
    const target = event.target;
    const isRelevantLinkInput =
      target && (target.id === 'total-issues-link' || target.id === 'major-issues-link');
    const isFormReloadEvent = target && target.id === 'report-builder-form';

    if (isRelevantLinkInput || isFormReloadEvent) {
      debouncedRecheckAllIssueCountFields();
    }
  });
});
