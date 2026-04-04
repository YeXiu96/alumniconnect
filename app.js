// ══════════════════════════════════════════════════
//  AlumniConnect — app.js
//  Database: Supabase (PostgreSQL)
// ══════════════════════════════════════════════════

const SUPABASE_URL = 'https://slkywdotsawetceowrzg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsa3l3ZG90c2F3ZXRjZW93cnpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyOTkwNzAsImV4cCI6MjA5MDg3NTA3MH0.uZeL8WuJzvXz0qKG4f2NP2JH_7pROcp90IxtTsyUxR0';

let supabase = null;
let currentUser = null;

// ══════════════ INIT ══════════════
async function init() {
  try {
    supabase = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    const { count, error } = await supabase
      .from('alumni')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    console.log("Supabase connected:", count);

    document.getElementById("loading-text").textContent =
      "Berhasil terhubung ke database!";

    setTimeout(() => {
      showPage("page-landing");
      loadLandingStat();
    }, 1000);

  } catch (err) {
    console.error("INIT ERROR:", err);
    document.getElementById("loading-text").textContent =
      "Gagal terhubung ke database";
  }
}

// ══════════════ REGISTER ══════════════
async function doRegister() {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const prodi = document.getElementById("reg-prodi").value;
  const tahun = parseInt(document.getElementById("reg-tahun").value);
  const pekerjaan = document.getElementById("reg-pekerjaan").value.trim();
  const password = document.getElementById("reg-password").value;

  const errEl = document.getElementById("register-error");
  const sucEl = document.getElementById("register-success");

  errEl.classList.add("hidden");
  sucEl.classList.add("hidden");

  if (!name || !email || !prodi || !tahun || !pekerjaan || !password) {
    return showError(errEl, "Semua field wajib diisi.");
  }

  try {
    const hashedPw = await hashPassword(password);

    const { data, error } = await supabase
      .from("alumni")
      .insert([{
        name,
        email,
        prodi,
        tahun,
        pekerjaan,
        password_hash: hashedPw
      }])
      .select()
      .single();

    if (error) throw error;

    await supabase.from("milestones").insert([{
      alumni_id: data.id,
      year: tahun,
      pos: "Lulus Sarjana",
      company: prodi,
      type: "start",
      description: "Memulai perjalanan karier"
    }]);

    sucEl.textContent = "✅ Akun berhasil dibuat!";
    sucEl.classList.remove("hidden");

    setTimeout(() => {
      showPage("page-login");
    }, 1500);

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    showError(errEl, "Gagal daftar: " + err.message);
  }
}

// ══════════════ LOGIN ══════════════
async function doLogin() {
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const errEl = document.getElementById("login-error");

  errEl.classList.add("hidden");

  if (!email || !password) {
    return showError(errEl, "Email dan password wajib diisi.");
  }

  try {
    const hashedPw = await hashPassword(password);

    const { data, error } = await supabase
      .from("alumni")
      .select("*")
      .eq("email", email)
      .eq("password_hash", hashedPw)
      .single();

    if (error || !data) {
      return showError(errEl, "Email atau password salah.");
    }

    currentUser = data;
    localStorage.setItem(
      "alumni_session",
      JSON.stringify({ id: data.id })
    );

    enterApp();

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    showError(errEl, "Gagal login: " + err.message);
  }
}

// ══════════════ APP ══════════════
function enterApp() {
  showPage("page-app");
  document.getElementById("dash-greeting").textContent =
    "Selamat datang, " + currentUser.name + " 👋";

  renderDashboard();
}

// ══════════════ DASHBOARD ══════════════
async function renderDashboard() {
  const { count } = await supabase
    .from("alumni")
    .select("*", { count: "exact", head: true });

  document.getElementById("dash-total").textContent = count;
  document.getElementById("dash-prodi").textContent = currentUser.prodi;
  document.getElementById("dash-job").textContent = currentUser.pekerjaan;
  document.getElementById("dash-tahun").textContent = currentUser.tahun;
}

// ══════════════ HELPERS ══════════════
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
}

async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

async function loadLandingStat() {
  const { count } = await supabase
    .from("alumni")
    .select("*", { count: "exact", head: true });

  document.getElementById("stat-count").textContent = count;
}

// START
init();
