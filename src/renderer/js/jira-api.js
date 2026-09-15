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
  // [MODIFIED] Tambah isSaved. Test & Save mati jika konfigurasi sudah tersimpan di lokal.
  // Sekarang juga mengunci (readonly) input email dan token jika isSaved = true.
  function updateControlButtons(isConnected, isSaved = false) {
    if (testBtn) testBtn.disabled = isSaved;
    // saveBtn dihapus dari logika karena tombol sudah dihilangkan dari UI
    if (resetBtn) resetBtn.disabled = !isConnected;
    // [MODIFIED] Ganti .disabled menjadi .readOnly agar input tidak bisa diedit tapi tetap terlihat aktif
    if (emailInput) emailInput.readOnly = isSaved;
    if (tokenInput) tokenInput.readOnly = isSaved;
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
    updateControlButtons(false, false); // [MODIFIED] Reset isSaved ke false agar input terbuka kembali
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
      updateControlButtons(false, false); // [MODIFIED] Pastikan state reset
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
        updateControlButtons(true, true); // [MODIFIED] isSaved = true -> lock inputs (readonly)
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
        updateControlButtons(false, false); // [MODIFIED] State reset
        setStatus('error', result?.message || '❌ Connection failed.');
        setJiraConnected(false);
      }
    } catch (err) {
      updateBanner(true);
      resetConnectedUser();
      updateControlButtons(false, false); // [MODIFIED] State reset
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
      updateControlButtons(false, false); // [MODIFIED] State reset
      updateBanner(true);
      return;
    }
    setStatus('loading', '⏳ Testing connection...');
    testBtn.disabled = true;
    try {
      const result = await window.qaToolkit.testJiraConnection({ email, token });
      if (result && result.success) {
        // [MODIFIED] Logika Baru: Jika sukses test, langsung simpan ke LocalStorage
        localStorage.setItem('jiraEmail', email);
        localStorage.setItem('jiraToken', token);
        // Sembunyikan banner karena status sudah otomatis tersimpan
        updateBanner(false);
        setStatus('success', '✅ Connected & Saved!');
        updateControlButtons(true, true); // [MODIFIED] isSaved = true -> kunci input (readonly) & tombol test
        userDisplay.textContent = extractUsername(result) || '-';
        if (result.avatarUrl && isTrustedAvatarUrl(result.avatarUrl)) {
          avatarImg.src = result.avatarUrl;
          avatarImg.style.display = 'block';
        } else {
          clearAvatar();
        }
        setJiraConnected(true);
        recheckAllIssueCountFields();
        showToast('Jira connected and configuration saved!', 'success');
      } else {
        updateBanner(true);
        setStatus('error', result?.message || '❌ Connection failed.');
        updateControlButtons(false, false); // [MODIFIED] State reset
        resetConnectedUser();
        setJiraConnected(false);
      }
    } catch (err) {
      updateBanner(true);
      setStatus('error', '❌ Connection failed.');
      updateControlButtons(false, false); // [MODIFIED] State reset
      resetConnectedUser();
      setJiraConnected(false);
    } finally {
      // [MODIFIED] Tombol hanya aktif kembali jika koneksi GAGAL.
      // Jika isJiraConnected = true, tombol tetap disabled sesuai updateControlButtons(true, true).
      if (!isJiraConnected) {
        testBtn.disabled = false;
      }
    }
  });
  // --- EVENT: Save Button ---
  // [DELETED] saveBtn.addEventListener('click', ...) dihapus karena logika save sudah dipindah ke event 'submit' (Auto-Save)
  // --- EVENT: Reset Button ---
  resetBtn.addEventListener('click', () => {
    // [MODIFIED] Gunakan dialog konfirmasi modal agar tampilan konsisten
    if (typeof window.showConfirmationDialog === 'function') {
      window.showConfirmationDialog(
        'Konfirmasi Reset',
        'Apakah Anda yakin ingin menghapus semua pengaturan Jira? Anda harus melakukan koneksi ulang setelah ini.',
        () => {
          executeReset();
        }
      );
    } else {
      // Fallback jika dialog gagal dimuat
      if (confirm('Apakah Anda yakin ingin mereset pengaturan Jira?')) {
        executeReset();
      }
    }
  });
  // [NEW] Pisahkan logika reset ke fungsi sendiri agar bisa dipanggil via callback dialog
  function executeReset() {
    localStorage.removeItem('jiraEmail');
    localStorage.removeItem('jiraToken');
    emailInput.value = '';
    tokenInput.value = '';
    resetConnectedUser();
    setStatus('', 'Jira configuration cleared.');
    updateControlButtons(false, false); // [MODIFIED] Reset status -> unlock inputs (readonly = false)
    updateBanner(true);
    setJiraConnected(false);
    showToast('Configuration has been reset.', 'info');
  }
  // =====================================================================
  // --- [NEW] FITUR: AUTO-COUNT TOTAL ISSUES & MAJOR ISSUES DARI JIRA ---
  // =====================================================================
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
    try {
      const cachedRaw = localStorage.getItem(`jiraIssueCount:${config.countInputId}`);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached && cached.url === linkInput.value.trim()) {
          lastFetchedUrl = cached.url;
          fetchedAtSpan.textContent = `${formatFetchedAt(new Date(cached.at))} (approx.)`;
        }
      }
    } catch {}
    async function runFetch({ force = false } = {}) {
      const rawUrl = linkInput.value.trim();
      if (!rawUrl || !isJiraConnected) return;
      const parsedFilter = parseJiraFilterInput(rawUrl);
      if (!parsedFilter) {
        fetchedAtSpan.textContent = 'URL filter tidak valid';
        return;
      }
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
            JSON.stringify({ url: rawUrl, result: result.count, at: now.getTime() })
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
