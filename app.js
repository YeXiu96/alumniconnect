const SUPABASE_URL = 'https://slkywdotsawetceowrzg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsa3l3ZG90c2F3ZXRjZW93cnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyOTkwNzAsImV4cCI6MjA5MDg3NTA3MH0.uZeL8WuJzvXz0qKG4f2NP2JH_7pROcp90IxtTsyUxR0';

// ── State ────────────────────────────────────────
let supabase = null;
let currentUser = null;
let searchDebounce = null;

// ══════════════ INISIALISASI ══════════════════════

async function init() {
  const url = SUPABASE_URL || localStorage.getItem('sb_url');
  const key = SUPABASE_KEY || localStorage.getItem('sb_key');

  if (!url || !key) {
    showConfigModal();
    return;
  }

  try {
    supabase = window.supabase.createClient(url, key);

    // Test koneksi
    const { error } = await supabase.from('alumni').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') throw error;

    // Cek sesi login
    const session = getSession();
    if (session) {
      const { data, error: err } = await supabase
        .from('alumni')
        .select('*')
        .eq('id', session.id)
        .single();

      if (!err && data) {
        currentUser = data;
        saveSession(data);
        enterApp();
        return;
      }
    }

    showPage('page-landing');
    loadLandingStat();

  } catch (err) {
    console.error('Supabase init error:', err);
    showConfigModal();
  }
}

// ══════════════ CONFIG MODAL ══════════════════════

function showConfigModal() {
  // Isi ulang jika ada tersimpan
  const savedUrl = localStorage.getItem('sb_url') || '';
  const savedKey = localStorage.getItem('sb_key') || '';
  document.getElementById('cfg-url').value = savedUrl;
  document.getElementById('cfg-key').value = savedKey;
  document.getElementById('modal-config').style.display = 'flex';
  showPage('page-landing');
}

async function saveConfig() {
  const url = document.getElementById('cfg-url').value.trim();
  const key = document.getElementById('cfg-key').value.trim();
  const errEl = document.getElementById('cfg-error');

  if (!url || !key) return showError(errEl, 'URL dan Key wajib diisi.');
  if (!url.startsWith('https://')) return showError(errEl, 'URL harus diawali https://');

  errEl.classList.add('hidden');
  const btn = document.querySelector('#modal-config .btn-primary');
  setLoading(btn, true, 'Menghubungkan...');

  try {
    supabase = window.supabase.createClient(url, key);
    const { error } = await supabase.from('alumni').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') throw new Error('Koneksi gagal: ' + error.message);

    localStorage.setItem('sb_url', url);
    localStorage.setItem('sb_key', key);
    document.getElementById('modal-config').style.display = 'none';
    setLoading(btn, false, 'Simpan & Hubungkan');
    showToast('✅ Berhasil terhubung ke Supabase!');
    loadLandingStat();

  } catch (err) {
    setLoading(btn, false, 'Simpan & Hubungkan');
    showError(errEl, 'Gagal terhubung: ' + err.message);
  }
}

// ══════════════ AUTH ══════════════════════════════

// Hash password sederhana (SHA-256 via Web Crypto API)
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function doRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim().toLowerCase();
  const prodi    = document.getElementById('reg-prodi').value;
  const tahun    = parseInt(document.getElementById('reg-tahun').value);
  const pekerjaan = document.getElementById('reg-pekerjaan').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl    = document.getElementById('register-error');
  const sucEl    = document.getElementById('register-success');
  const btn      = document.getElementById('btn-register');

  sucEl.classList.add('hidden');
  if (!name || !email || !prodi || !tahun || !pekerjaan || !password)
    return showError(errEl, 'Semua field wajib diisi.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return showError(errEl, 'Format email tidak valid.');
  if (password.length < 6)
    return showError(errEl, 'Password minimal 6 karakter.');
  if (!supabase)
    return showError(errEl, 'Database belum terhubung. Konfigurasi Supabase terlebih dahulu.');

  errEl.classList.add('hidden');
  setLoading(btn, true, 'Mendaftarkan...');

  try {
    // Cek duplikat email
    const { data: existing } = await supabase
      .from('alumni')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      setLoading(btn, false, 'Buat Akun');
      return showError(errEl, 'Email sudah terdaftar. Silakan login.');
    }

    const hashedPw = await hashPassword(password);

    const { data, error } = await supabase
      .from('alumni')
      .insert([{ name, email, prodi, tahun, pekerjaan, password_hash: hashedPw }])
      .select()
      .single();

    if (error) throw error;

    // Tambah milestone awal otomatis
    await supabase.from('milestones').insert([{
      alumni_id: data.id,
      year: tahun,
      pos: 'Lulus Sarjana',
      company: prodi,
      type: 'start',
      description: 'Menyelesaikan studi dan siap memasuki dunia profesional.'
    }]);

    setLoading(btn, false, 'Buat Akun');
    sucEl.textContent = '✅ Akun berhasil dibuat! Silakan login.';
    sucEl.classList.remove('hidden');
    clearFields(['reg-name','reg-email','reg-prodi','reg-tahun','reg-pekerjaan','reg-password']);
    setTimeout(() => showPage('page-login'), 1500);

  } catch (err) {
    setLoading(btn, false, 'Buat Akun');
    showError(errEl, 'Gagal mendaftar: ' + err.message);
  }
}

async function doLogin() {
  const email    = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  const btn      = document.getElementById('btn-login');

  if (!email || !password) return showError(errEl, 'Email dan password wajib diisi.');
  if (!supabase) return showError(errEl, 'Database belum terhubung.');

  errEl.classList.add('hidden');
  setLoading(btn, true, 'Masuk...');

  try {
    const hashedPw = await hashPassword(password);

    const { data, error } = await supabase
      .from('alumni')
      .select('*')
      .eq('email', email)
      .eq('password_hash', hashedPw)
      .single();

    if (error || !data) {
      setLoading(btn, false, 'Masuk');
      return showError(errEl, 'Email atau password salah.');
    }

    currentUser = data;
    saveSession(data);
    clearFields(['login-email','login-password']);
    setLoading(btn, false, 'Masuk');
    errEl.classList.add('hidden');
    enterApp();

  } catch (err) {
    setLoading(btn, false, 'Masuk');
    showError(errEl, 'Terjadi kesalahan: ' + err.message);
  }
}

async function doLogout() {
  currentUser = null;
  clearSession();
  showPage('page-landing');
  loadLandingStat();
  showToast('👋 Sampai jumpa!');
}

// ══════════════ APP ════════════════════════════════

function enterApp() {
  showPage('page-app');
  updateSidebar();
  // reset tabs
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-tab="tab-dashboard"]').classList.add('active');
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-dashboard').classList.add('active');
  document.getElementById('topbar-title').textContent = 'Dashboard';
  renderDashboard();
}

function updateSidebar() {
  if (!currentUser) return;
  document.getElementById('sidebar-user-info').innerHTML =
    `<strong>${currentUser.name}</strong>${currentUser.prodi}`;
  document.getElementById('topbar-user').textContent = currentUser.name.split(' ')[0];
}

// ══════════════ DASHBOARD ══════════════════════════

async function renderDashboard() {
  if (!currentUser || !supabase) return;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam';
  document.getElementById('dash-greeting').textContent = `${greeting}, ${currentUser.name.split(' ')[0]}! 👋`;
  document.getElementById('dash-prodi').textContent = currentUser.prodi;
  document.getElementById('dash-job').textContent = currentUser.pekerjaan;
  document.getElementById('dash-tahun').textContent = currentUser.tahun;

  // Ambil total alumni
  const { count } = await supabase.from('alumni').select('*', { count: 'exact', head: true });
  animateCount(document.getElementById('dash-total'), count || 0);

  // Alumni terbaru
  const { data: recent } = await supabase
    .from('alumni')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);

  const container = document.getElementById('recent-alumni');
  container.innerHTML = '';
  if (!recent || recent.length === 0) {
    container.innerHTML = '<p style="color:var(--text-light);font-size:.9rem">Belum ada alumni lain.</p>';
    return;
  }
  recent.forEach(a => container.appendChild(buildAlumniCard(a)));
}

async function loadLandingStat() {
  if (!supabase) return;
  try {
    const { count } = await supabase.from('alumni').select('*', { count: 'exact', head: true });
    animateCount(document.getElementById('stat-count'), count || 0);
  } catch (_) {}
}

// ══════════════ PROFIL ══════════════════════════════

function renderProfile() {
  if (!currentUser) return;
  const u = currentUser;
  document.getElementById('profile-avatar-circle').textContent = u.name.charAt(0).toUpperCase();
  document.getElementById('profile-name-big').textContent = u.name;
  document.getElementById('profile-job-big').textContent = u.pekerjaan;
  document.getElementById('profile-badge-prodi').textContent = u.prodi;
  document.getElementById('profile-badge-tahun').textContent = 'Lulus ' + u.tahun;
  document.getElementById('pd-name').textContent = u.name;
  document.getElementById('pd-email').textContent = u.email;
  document.getElementById('pd-prodi').textContent = u.prodi;
  document.getElementById('pd-tahun').textContent = u.tahun;
  document.getElementById('pd-job').textContent = u.pekerjaan;
}

function openEditModal() {
  document.getElementById('edit-name').value = currentUser.name;
  document.getElementById('edit-job').value = currentUser.pekerjaan;
  document.getElementById('edit-prodi').value = currentUser.prodi;
  document.getElementById('edit-tahun').value = currentUser.tahun;
  document.getElementById('modal-edit').classList.remove('hidden');
}

async function saveEdit() {
  const name  = document.getElementById('edit-name').value.trim();
  const job   = document.getElementById('edit-job').value.trim();
  const prodi = document.getElementById('edit-prodi').value;
  const tahun = parseInt(document.getElementById('edit-tahun').value);
  if (!name || !job) return showToast('⚠️ Nama dan pekerjaan wajib diisi.');

  const btn = document.getElementById('btn-save-edit');
  setLoading(btn, true, 'Menyimpan...');

  const { data, error } = await supabase
    .from('alumni')
    .update({ name, pekerjaan: job, prodi, tahun })
    .eq('id', currentUser.id)
    .select()
    .single();

  setLoading(btn, false, 'Simpan');
  if (error) return showToast('❌ Gagal menyimpan: ' + error.message);

  currentUser = data;
  saveSession(data);
  closeModal('modal-edit');
  renderProfile();
  updateSidebar();
  renderDashboard();
  showToast('✅ Profil berhasil diperbarui!');
}

// ══════════════ CARI ALUMNI ══════════════════════════

async function doSearch() {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(async () => {
    const query = (document.getElementById('search-input').value || '').trim();
    const prodi = document.getElementById('search-prodi').value;

    let req = supabase.from('alumni').select('*').order('name');
    if (query) req = req.ilike('name', `%${query}%`);
    if (prodi) req = req.eq('prodi', prodi);

    const { data, error } = await req;
    const container = document.getElementById('search-results');
    const emptyEl = document.getElementById('search-empty');
    container.innerHTML = '';

    if (error || !data || data.length === 0) {
      emptyEl.classList.remove('hidden');
    } else {
      emptyEl.classList.add('hidden');
      data.forEach(a => container.appendChild(buildAlumniCard(a)));
    }
  }, 300);
}

// ══════════════ CAREER MILESTONE ══════════════════════

async function renderCareer() {
  if (!currentUser || !supabase) return;
  const { data: milestones, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('alumni_id', currentUser.id)
    .order('year', { ascending: true });

  const timeline = document.getElementById('career-timeline');
  const emptyEl  = document.getElementById('career-empty');
  const summaryEl = document.getElementById('career-summary-content');
  timeline.innerHTML = '';

  if (error || !milestones || milestones.length === 0) {
    emptyEl.classList.remove('hidden');
    summaryEl.innerHTML = '<p style="color:rgba(255,255,255,.45);font-size:.85rem">Belum ada data karier.</p>';
    return;
  }

  emptyEl.classList.add('hidden');
  const first   = milestones[0];
  const current = milestones.filter(m => m.type === 'current').pop() || milestones[milestones.length - 1];

  summaryEl.innerHTML = `
    <div class="career-summary-item"><div class="cs-icon">🎓</div><div><strong>Tahun Lulus</strong><span>${first.year}</span></div></div>
    <div class="career-summary-item"><div class="cs-icon">🚀</div><div><strong>Karier Pertama</strong><span>${first.pos} — ${first.company}</span></div></div>
    <div class="career-summary-item"><div class="cs-icon">💼</div><div><strong>Posisi Terkini</strong><span>${current.pos} — ${current.company}</span></div></div>
    <div class="career-summary-item"><div class="cs-icon">📊</div><div><strong>Total Milestone</strong><span>${milestones.length} pencapaian</span></div></div>
  `;

  const typeBadge = { start: '🎓 Awal Karier', milestone: '⭐ Pencapaian', current: '🟢 Saat Ini' };
  milestones.forEach(m => {
    const item = document.createElement('div');
    item.className = 'timeline-item' + (m.type === 'current' ? ' current' : '');
    item.innerHTML = `
      <div class="ti-year">${m.year}</div>
      <div class="ti-pos">${m.pos}</div>
      <div class="ti-company">${m.company}</div>
      ${m.description ? `<div class="ti-desc">${m.description}</div>` : ''}
      <div class="ti-badge"><span class="badge">${typeBadge[m.type] || m.type}</span></div>
    `;
    timeline.appendChild(item);
  });
}

function openCareerModal() {
  ['career-year','career-pos','career-company','career-desc'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('career-type').value = 'milestone';
  document.getElementById('modal-career').classList.remove('hidden');
}

async function saveCareer() {
  const year    = parseInt(document.getElementById('career-year').value);
  const pos     = document.getElementById('career-pos').value.trim();
  const company = document.getElementById('career-company').value.trim();
  const type    = document.getElementById('career-type').value;
  const desc    = document.getElementById('career-desc').value.trim();

  if (!year || !pos || !company) return showToast('⚠️ Tahun, posisi, dan perusahaan wajib diisi.');

  const btn = document.getElementById('btn-save-career');
  setLoading(btn, true, 'Menyimpan...');

  const { error } = await supabase.from('milestones').insert([{
    alumni_id: currentUser.id, year, pos, company, type, description: desc
  }]);

  setLoading(btn, false, 'Simpan');
  if (error) return showToast('❌ Gagal menyimpan: ' + error.message);

  closeModal('modal-career');
  await renderCareer();
  showToast('✅ Milestone berhasil ditambahkan!');
}

// ══════════════ NAVIGASI ══════════════════════════

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function hidePage(id) {
  document.getElementById(id).classList.remove('active');
}

function switchTab(el) {
  const tabId = el.dataset.tab;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');

  const titles = { 'tab-dashboard': 'Dashboard', 'tab-profil': 'Profil Saya', 'tab-cari': 'Cari Alumni', 'tab-career': 'Career Milestone' };
  document.getElementById('topbar-title').textContent = titles[tabId] || '';

  if (tabId === 'tab-profil') renderProfile();
  if (tabId === 'tab-career') renderCareer();
  if (tabId === 'tab-cari') doSearch();
  if (tabId === 'tab-dashboard') renderDashboard();
  document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ══════════════ HELPERS ══════════════════════════

function buildAlumniCard(a) {
  const div = document.createElement('div');
  div.className = 'alumni-card';
  div.innerHTML = `
    <div class="alumni-card-avatar">${a.name.charAt(0).toUpperCase()}</div>
    <h4>${a.name}</h4>
    <p class="alumni-job">${a.pekerjaan}</p>
    <span class="badge">${a.prodi}</span>
    <span class="badge secondary">Lulus ${a.tahun}</span>
  `;
  return div;
}

function animateCount(el, target) {
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const iv = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(iv);
  }, 40);
}

function setLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = text;
}

function showError(el, msg) { if (el) { el.textContent = msg; el.classList.remove('hidden'); } }
function clearFields(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Session di localStorage (hanya ID & nama, bukan data sensitif)
function getSession() {
  try { return JSON.parse(localStorage.getItem('alumni_session') || 'null'); } catch { return null; }
}
function saveSession(user) {
  localStorage.setItem('alumni_session', JSON.stringify({ id: user.id, email: user.email }));
}
function clearSession() { localStorage.removeItem('alumni_session'); }

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3200);
}

// ══════════════ KEYBOARD ══════════════════════════

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal('modal-edit');
    closeModal('modal-career');
  }
  if (e.key === 'Enter') {
    if (document.getElementById('page-login').classList.contains('active')) doLogin();
    if (document.getElementById('page-register').classList.contains('active')) doRegister();
  }
});

// ══════════════ START ═════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Tunggu Supabase script selesai dimuat
  const checkSupabase = () => {
    if (window.supabase) {
      init();
    } else {
      setTimeout(checkSupabase, 100);
    }
  };
  checkSupabase();
});
