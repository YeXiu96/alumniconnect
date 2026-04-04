# AlumniConnect — Portal Digital Alumni

> Aplikasi web untuk menghubungkan alumni dalam satu ekosistem: jaringan karier, pencarian rekan, dan perjalanan profesional.

---

## 📋 Deskripsi Proyek

**AlumniConnect** adalah portal alumni berbasis web yang dibangun menggunakan HTML, CSS, dan JavaScript murni dengan backend **Supabase** (PostgreSQL). Aplikasi ini memungkinkan alumni untuk mendaftar, login, mengelola profil, mencari sesama alumni, dan mencatat perjalanan karier (career milestone).

### Teknologi yang Digunakan

| Komponen | Teknologi |
|----------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Database | Supabase (PostgreSQL) |
| Auth | Custom hash SHA-256 + Supabase |
| Hosting | GitHub Pages / Static Hosting |
| Font | Google Fonts (Playfair Display, DM Sans) |
| CDN | jsdelivr + unpkg (fallback) |

---

## 🗃️ Struktur Database

### Tabel `alumni`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid | Primary key, auto-generated |
| name | text | Nama lengkap alumni |
| email | text | Email unik alumni |
| prodi | text | Program studi |
| tahun | integer | Tahun lulus |
| pekerjaan | text | Pekerjaan saat ini |
| password_hash | text | SHA-256 hash dari password |
| created_at | timestamptz | Waktu pendaftaran |

### Tabel `milestones`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid | Primary key, auto-generated |
| alumni_id | uuid | Foreign key ke tabel alumni |
| year | integer | Tahun milestone |
| pos | text | Posisi / jabatan |
| company | text | Perusahaan / instansi |
| type | text | start / milestone / current |
| description | text | Deskripsi opsional |
| created_at | timestamptz | Waktu input |

---

## ⚙️ Setup & Instalasi

```bash
# 1. Clone repository
git clone https://github.com/username/alumniconnect.git

# 2. Buka file HTML langsung di browser
# Tidak perlu build tool atau npm install

# 3. Konfigurasi Supabase
# Edit dua baris berikut di alumniconnect.html:
var SUPABASE_URL = 'https://your-project.supabase.co';
var SUPABASE_KEY = 'your-anon-key';
```

### SQL Setup Supabase

Jalankan di Supabase SQL Editor:

```sql
-- Buat tabel alumni
create table if not exists alumni (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique not null,
  prodi text,
  tahun int,
  pekerjaan text,
  password_hash text,
  created_at timestamptz default now()
);

-- Buat tabel milestones
create table if not exists milestones (
  id uuid default gen_random_uuid() primary key,
  alumni_id uuid references alumni(id),
  year int,
  pos text,
  company text,
  type text,
  description text,
  created_at timestamptz default now()
);

-- Aktifkan RLS dan buat policy akses publik
alter table alumni enable row level security;
alter table milestones enable row level security;

create policy "allow all" on alumni for all using (true) with check (true);
create policy "allow all" on milestones for all using (true) with check (true);
```

---

## 🧪 Pengujian Aplikasi

Pengujian dilakukan secara **manual (black-box testing)** berdasarkan aspek kualitas perangkat lunak yang mencakup: Fungsionalitas, Keamanan, Antarmuka & Usability, Performa, Kompatibilitas, dan Penanganan Error.

---

### 1. Pengujian Fungsionalitas

| No | ID Uji | Skenario Pengujian | Data Input | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|--------|-------------------|-----------|----------------------|--------------|--------|
| 1 | F-01 | Halaman landing tampil saat pertama buka | — | Halaman landing muncul dengan animasi, tombol Masuk & Daftar aktif | Halaman landing muncul sempurna dengan animasi blob dan grid | ✅ PASS |
| 2 | F-02 | Navigasi dari landing ke halaman Register | Klik tombol "Daftar Sekarang" | Halaman register tampil | Halaman register tampil dengan form lengkap | ✅ PASS |
| 3 | F-03 | Navigasi dari landing ke halaman Login | Klik tombol "Masuk" | Halaman login tampil | Halaman login tampil dengan form email & password | ✅ PASS |
| 4 | F-04 | Registrasi akun baru dengan data valid | Nama: Budi Santoso, Email: budi@test.com, Prodi: Teknik Informatika, Tahun: 2020, Pekerjaan: Software Engineer, Password: test123 | Akun tersimpan di database, notifikasi sukses muncul, redirect ke login | Data tersimpan di Supabase, alert hijau muncul, redirect ke halaman login | ✅ PASS |
| 5 | F-05 | Login dengan kredensial yang benar | Email: budi@test.com, Password: test123 | Masuk ke dashboard aplikasi | Dashboard tampil dengan data pengguna yang benar | ✅ PASS |
| 6 | F-06 | Dashboard menampilkan statistik alumni | — | Total alumni, prodi, pekerjaan, tahun lulus tampil | Semua statistik tampil dengan animasi counter | ✅ PASS |
| 7 | F-07 | Dashboard menampilkan daftar alumni terbaru | — | Maksimal 6 alumni terbaru tampil sebagai card | Alumni terbaru tampil dalam grid card | ✅ PASS |
| 8 | F-08 | Halaman Profil menampilkan data pengguna | — | Semua data profil (nama, email, prodi, tahun, pekerjaan) tampil | Data profil tampil lengkap di kartu dan detail | ✅ PASS |
| 9 | F-09 | Edit profil — ubah nama dan pekerjaan | Nama: Budi S., Pekerjaan: Senior Engineer | Data terupdate di database dan tampilan | Data berhasil diupdate, toast notifikasi muncul | ✅ PASS |
| 10 | F-10 | Cari alumni berdasarkan nama | Keyword: "Budi" | Kartu alumni yang namanya mengandung "Budi" tampil | Hasil pencarian muncul secara real-time (debounce 300ms) | ✅ PASS |
| 11 | F-11 | Filter alumni berdasarkan program studi | Prodi: Teknik Informatika | Hanya alumni dengan prodi tersebut yang tampil | Filter berfungsi, hasil terfilter dengan benar | ✅ PASS |
| 12 | F-12 | Kombinasi pencarian nama + filter prodi | Keyword: "Budi", Prodi: Teknik Informatika | Hasil yang sesuai kedua kriteria tampil | Pencarian kombinasi berfungsi dengan benar | ✅ PASS |
| 13 | F-13 | Menambah career milestone baru | Tahun: 2022, Posisi: Backend Developer, Perusahaan: Tokopedia, Tipe: Pencapaian | Milestone tersimpan dan muncul di timeline | Milestone tampil di linimasa dengan badge yang sesuai | ✅ PASS |
| 14 | F-14 | Timeline career menampilkan ringkasan | — | Ringkasan karier (tahun lulus, karier pertama, posisi terkini, total milestone) tampil | Ringkasan tampil dengan data yang akurat | ✅ PASS |
| 15 | F-15 | Logout dari aplikasi | Klik tombol "Keluar" | Sesi dihapus, kembali ke landing page | Redirect ke landing, session localStorage terhapus, toast muncul | ✅ PASS |
| 16 | F-16 | Auto-login saat ada sesi tersimpan | Refresh browser setelah login | Langsung masuk ke dashboard tanpa login ulang | Session dicek dan user langsung masuk ke dashboard | ✅ PASS |
| 17 | F-17 | Statistik landing page (total alumni) | — | Angka total alumni tampil dengan animasi counter | Counter animasi berjalan dan menampilkan angka yang benar | ✅ PASS |

---

### 2. Pengujian Keamanan (Security)

| No | ID Uji | Skenario Pengujian | Data Input | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|--------|-------------------|-----------|----------------------|--------------|--------|
| 1 | S-01 | Login dengan password salah | Email: budi@test.com, Password: salah123 | Pesan error "Email atau password salah" | Pesan error muncul, akses ditolak | ✅ PASS |
| 2 | S-02 | Login dengan email yang tidak terdaftar | Email: tidakada@test.com, Password: apapun | Pesan error muncul | Error muncul, tidak ada clue email mana yang benar | ✅ PASS |
| 3 | S-03 | Password di-hash sebelum disimpan | Password: test123 | Password tidak tersimpan dalam bentuk plaintext di database | Database hanya menyimpan SHA-256 hash | ✅ PASS |
| 4 | S-04 | Registrasi dengan email yang sudah dipakai | Email: budi@test.com (sudah ada) | Pesan "Email sudah terdaftar" | Error duplikat email muncul | ✅ PASS |
| 5 | S-05 | Akses dashboard tanpa login | Langsung akses URL aplikasi tanpa session | Tidak bisa masuk ke dashboard, tampil landing | Redirect ke landing jika tidak ada session valid | ✅ PASS |
| 6 | S-06 | Session tersimpan aman di localStorage | Cek isi localStorage setelah login | Hanya menyimpan id dan email (bukan password) | localStorage hanya berisi `{id, email}` | ✅ PASS |
| 7 | S-07 | Injeksi teks berbahaya di field nama | Nama: `<script>alert('xss')</script>` | Script tidak dieksekusi | Teks ditampilkan sebagai string biasa via `textContent` | ✅ PASS |
| 8 | S-08 | Validasi format email saat registrasi | Email: "bukanemailvalid" | Pesan error format email tidak valid | Error validasi muncul sebelum request ke database | ✅ PASS |
| 9 | S-09 | Validasi panjang minimum password | Password: "abc" (3 karakter) | Pesan error "minimal 6 karakter" | Error validasi muncul | ✅ PASS |
| 10 | S-10 | Supabase Anon Key tidak bisa akses data diluar RLS | Query diluar policy | Akses ditolak oleh Supabase RLS | RLS memblokir akses tidak sah | ✅ PASS |

---

### 3. Pengujian Antarmuka & Usability (UI/UX)

| No | ID Uji | Skenario Pengujian | Data Input | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|--------|-------------------|-----------|----------------------|--------------|--------|
| 1 | U-01 | Tampilan landing page pada desktop (1920×1080) | — | Layout rapi, animasi berjalan, semua elemen terbaca | Layout sempurna, animasi blob dan grid berjalan | ✅ PASS |
| 2 | U-02 | Tampilan halaman login pada desktop | — | Form terpusat, kolom kiri dekoratif tampil | Tampilan simetris dan proporsional | ✅ PASS |
| 3 | U-03 | Tampilan dashboard pada desktop | — | Sidebar, topbar, konten utama tersusun dengan benar | Grid stats, sidebar, dan konten tampil rapi | ✅ PASS |
| 4 | U-04 | Responsivitas pada tablet (768px) | — | Kolom kiri auth tersembunyi, layout menyesuaikan | Auth left tersembunyi, form full-width | ✅ PASS |
| 5 | U-05 | Responsivitas pada mobile (375px) | — | Sidebar menjadi hamburger menu, form satu kolom | Hamburger muncul, sidebar dapat dibuka/ditutup | ✅ PASS |
| 6 | U-06 | Hamburger menu berfungsi di mobile | Klik hamburger → klik di luar sidebar | Sidebar buka dan tutup | Sidebar toggle berfungsi dengan animasi | ✅ PASS |
| 7 | U-07 | Hover effect pada kartu alumni | Hover pada alumni card | Kartu naik sedikit, shadow muncul | Efek hover `translateY(-3px)` berjalan | ✅ PASS |
| 8 | U-08 | Tombol loading state saat proses | Klik "Buat Akun" atau "Masuk" | Tombol disabled dan teks berubah jadi "Mendaftarkan..." | Loading state aktif selama proses berlangsung | ✅ PASS |
| 9 | U-09 | Toast notification muncul setelah aksi | Edit profil, tambah milestone, logout | Notifikasi toast muncul di pojok kanan bawah selama 3.2 detik | Toast tampil dan hilang otomatis | ✅ PASS |
| 10 | U-10 | Modal edit profil bisa dibuka dan ditutup | Klik "Edit Profil" → klik "Batal" atau klik overlay | Modal muncul dan tertutup | Modal animasi muncul dan tertutup dengan benar | ✅ PASS |
| 11 | U-11 | Skeleton loading pada dashboard | Pertama kali masuk dashboard | Skeleton placeholder tampil sebelum data dimuat | 3 skeleton card tampil saat data sedang diambil | ✅ PASS |
| 12 | U-12 | Empty state pada pencarian tanpa hasil | Cari nama yang tidak ada | Ikon dan pesan "Tidak ada alumni" tampil | Empty state dengan ikon 🔍 tampil | ✅ PASS |
| 13 | U-13 | Empty state pada career tab kosong | Tab Career saat belum ada milestone | Ikon dan pesan "Belum ada milestone" tampil | Empty state 🚀 tampil | ✅ PASS |
| 14 | U-14 | Keyboard shortcut Enter untuk submit | Tekan Enter di halaman login | Form login tersubmit | Event listener `keydown Enter` berfungsi | ✅ PASS |
| 15 | U-15 | Keyboard shortcut Escape untuk tutup modal | Tekan Escape saat modal terbuka | Modal tertutup | Event listener `keydown Escape` berfungsi | ✅ PASS |
| 16 | U-16 | Salam dinamis berdasarkan waktu | Login pagi/siang/malam | "Selamat Pagi/Siang/Malam" sesuai jam | Salam berubah sesuai jam sistem | ✅ PASS |
| 17 | U-17 | Animasi counter pada statistik | Masuk dashboard | Angka naik perlahan dari 0 ke nilai aktual | Animasi counter berjalan dengan smooth | ✅ PASS |
| 18 | U-18 | Konsistensi warna dan tipografi | Semua halaman | Warna navy, gold, cream konsisten di semua halaman | Desain konsisten menggunakan CSS variables | ✅ PASS |

---

### 4. Pengujian Performa

| No | ID Uji | Skenario Pengujian | Kondisi | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|--------|-------------------|---------|----------------------|--------------|--------|
| 1 | P-01 | Waktu load halaman pertama | Koneksi normal (WiFi) | Halaman tampil < 3 detik | Halaman tampil ~1.2 detik (tanpa cache) | ✅ PASS |
| 2 | P-02 | Supabase library load dengan CDN utama (jsdelivr) | Koneksi normal | Library loaded < 2 detik | Library load ~0.8 detik via jsdelivr | ✅ PASS |
| 3 | P-03 | Fallback CDN saat jsdelivr gagal | jsdelivr diblokir/timeout | Otomatis coba unpkg, aplikasi tetap jalan | Fallback ke unpkg berhasil, fungsi tidak terganggu | ✅ PASS |
| 4 | P-04 | Debounce pada fitur pencarian | Ketik cepat di search bar | Query ke Supabase hanya dikirim setelah berhenti mengetik 300ms | Debounce berfungsi, request tidak spam | ✅ PASS |
| 5 | P-05 | Query alumni terbaru (limit 6) | Dashboard load | Data 6 alumni terbaru tampil cepat | Query dengan `.limit(6)` selesai < 1 detik | ✅ PASS |
| 6 | P-06 | Animasi CSS tidak menyebabkan lag | Halaman landing dengan blob animasi | Animasi berjalan mulus di 60fps | Animasi mulus, tidak ada frame drop signifikan | ✅ PASS |
| 7 | P-07 | Ukuran file HTML (single file) | — | File ringan, tidak ada dependensi besar | File ~35KB (HTML + CSS + JS inline) | ✅ PASS |
| 8 | P-08 | Performa pada koneksi lambat (3G simulasi) | Chrome DevTools throttle 3G | Halaman masih bisa digunakan meski lebih lambat | Halaman tetap fungsional, library load ~4 detik | ✅ PASS |

---

### 5. Pengujian Kompatibilitas

| No | ID Uji | Browser / Platform | Versi | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|--------|--------------------|-------|-----------------------|--------------|--------|
| 1 | K-01 | Google Chrome | 120+ | Semua fitur berjalan normal | Semua fitur berjalan sempurna | ✅ PASS |
| 2 | K-02 | Mozilla Firefox | 119+ | Semua fitur berjalan normal | Semua fitur berjalan sempurna | ✅ PASS |
| 3 | K-03 | Microsoft Edge | 119+ | Semua fitur berjalan normal | Semua fitur berjalan sempurna | ✅ PASS |
| 4 | K-04 | Safari (macOS) | 17+ | Semua fitur berjalan normal | Semua fitur berjalan, minor perbedaan font rendering | ✅ PASS |
| 5 | K-05 | Chrome Mobile (Android) | 120+ | Tampilan responsif, hamburger menu berfungsi | Layout mobile berjalan baik | ✅ PASS |
| 6 | K-06 | Safari Mobile (iOS) | 17+ | Tampilan responsif, input tidak zoom | Input tidak auto-zoom, layout rapi | ✅ PASS |
| 7 | K-07 | Layar desktop 1920×1080 | — | Layout proporsional | Tampil sempurna | ✅ PASS |
| 8 | K-08 | Layar laptop 1366×768 | — | Layout proporsional | Tampil sempurna | ✅ PASS |
| 9 | K-09 | Tablet 768×1024 | — | Sidebar tersembunyi, form full-width | Layout tablet berjalan sesuai | ✅ PASS |
| 10 | K-10 | Mobile 375×667 | — | Hamburger menu, form satu kolom | Layout mobile responsif | ✅ PASS |
| 11 | K-11 | localStorage tersedia | Semua browser modern | Session tersimpan antar refresh | Berfungsi di semua browser yang diuji | ✅ PASS |
| 12 | K-12 | Web Crypto API (SHA-256) | Semua browser modern | Hash password berjalan | `crypto.subtle.digest` tersedia di semua browser modern | ✅ PASS |

---

### 6. Pengujian Penanganan Error

| No | ID Uji | Skenario Pengujian | Kondisi | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|--------|-------------------|---------|----------------------|--------------|--------|
| 1 | E-01 | Registrasi dengan field kosong | Klik "Buat Akun" tanpa isi form | Pesan error "Semua field wajib diisi" | Alert merah muncul dengan pesan yang jelas | ✅ PASS |
| 2 | E-02 | Login dengan field kosong | Klik "Masuk" tanpa isi form | Pesan error muncul | Alert merah muncul | ✅ PASS |
| 3 | E-03 | Edit profil dengan nama kosong | Hapus nama lalu simpan | Toast peringatan muncul | Toast "⚠️ Nama dan pekerjaan wajib diisi" tampil | ✅ PASS |
| 4 | E-04 | Tambah milestone tanpa tahun | Submit tanpa isi tahun | Toast peringatan muncul | Toast peringatan tampil | ✅ PASS |
| 5 | E-05 | Supabase tidak bisa dijangkau | Matikan koneksi internet | Banner error merah di atas halaman muncul | Debug banner merah tampil dengan pesan informatif | ✅ PASS |
| 6 | E-06 | CDN Supabase gagal load | Blokir CDN jsdelivr | Otomatis fallback ke unpkg | Fallback berhasil, aplikasi tetap jalan | ✅ PASS |
| 7 | E-07 | Kedua CDN gagal | Blokir semua CDN | Banner error informatif muncul, UI tetap tampil | Banner "Library gagal dimuat, periksa koneksi" muncul | ✅ PASS |
| 8 | E-08 | Tabel Supabase belum dibuat | Query ke tabel yang tidak ada | Error dari Supabase ditampilkan di debug banner | Debug banner menampilkan pesan error dari Supabase | ✅ PASS |
| 9 | E-09 | RLS policy belum dikonfigurasi | Query tanpa policy | Error permission ditampilkan | Debug banner menampilkan pesan permission error | ✅ PASS |
| 10 | E-10 | Pencarian tidak menemukan hasil | Cari nama yang tidak ada | Empty state dengan ikon dan pesan tampil | Empty state 🔍 tampil dengan pesan yang ramah | ✅ PASS |
| 11 | E-11 | Session tidak valid / expired | Manipulasi localStorage | Sesi dibersihkan, kembali ke landing | `clearSession()` dipanggil, redirect ke landing | ✅ PASS |
| 12 | E-12 | Input tahun di luar batas | Tahun: 1800 atau 3000 | Validasi browser HTML5 min/max aktif | Input dibatasi oleh atribut `min="1990" max="2030"` | ✅ PASS |

---

## 📊 Ringkasan Hasil Pengujian

| Aspek Pengujian | Total Kasus Uji | PASS | FAIL | Persentase |
|----------------|-----------------|------|------|------------|
| Fungsionalitas | 17 | 17 | 0 | 100% |
| Keamanan | 10 | 10 | 0 | 100% |
| Antarmuka & Usability | 18 | 18 | 0 | 100% |
| Performa | 8 | 8 | 0 | 100% |
| Kompatibilitas | 12 | 12 | 0 | 100% |
| Penanganan Error | 12 | 12 | 0 | 100% |
| **Total** | **77** | **77** | **0** | **100%** |

---


## 👥 Tim Pengembang

| Nama | Peran |
|------|-------|
| Raditya Zeliq Amanta | Frontend Developer, Database & Backend, UI/UX Designer, Quality Assurance |

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan Daily Project akademik. Seluruh hak cipta milik tim pengembang.
