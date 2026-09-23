# ZeroTrace 🛡️

> **Stateless Cryptographic Zero-Trace Link Gateway**  
> Engineered by **noxm007**

ZeroTrace adalah arsitektur pelindung tautan (*link protector*) dan pemendek URL yang dirancang khusus untuk memblokir pelacakan otomatis oleh bot, web scraper, crawler DMCA, serta *URL expander*. Proyek ini lahir sebagai solusi atas rentannya pemendek URL standar terhadap ekstraksi tautan otomatis.

---

## 📖 Latar Belakang Masalah

### 1. Mengapa URL Shortener Standar Mudah Dilacak?
Secara teknis protokol web, tidak ada layanan pemendek URL (URL shortener) berbasis *redirect* yang benar-benar aman dari pelacakan.
- **Mekanisme HTTP:** Saat tautan dibuka, server mengirim respons `301/302` beserta header `Location` berisi alamat asli.
- **Visibilitas:** Alat seperti cURL, Python `requests`, atau *URL expander* dapat membaca header ini dalam hitungan milidetik tanpa mengeksekusi halaman web. Tautan asli langsung terekspos.

### 2. Mengapa Proteksi Captcha (Turnstile/reCAPTCHA) Sering Gagal?
Layanan pemendek URL beriklan sering menggunakan sistem captcha komersial. Namun, karena layanan ini sangat populer, penyedia layanan *solver bot* (seperti 2Captcha, CapMonster) telah membangun API otomatis untuk memecahkannya. Bot mereka dapat menembus gerbang ini dengan mudah.

---

## 🧠 Solusi ZeroTrace: *Moving Target Defense*

Untuk menghentikan bot otomatis tanpa membuat pengunjung pusing dengan pop-up iklan atau teka-teki gambar, ZeroTrace menghindari captcha pasaran dan beralih ke mekanisme **Zero-Knowledge** di sisi klien dengan alur yang tidak deterministik.

ZeroTrace menggabungkan 3 metode pertahanan yang akan **diacak kombinasi dan urutannya (Moving Target Defense)** pada setiap sesi pengunjung:

### Lapis 1: Proof-of-Work (PoW) Challenge
Mengirimkan tugas kriptografi matematika (mencari nonce untuk hash SHA-256 dengan awalan 0) ke peramban pengunjung.
- **Keunggulan:** Bagi satu pengunjung manusia, proses ini berjalan di latar belakang dan selesai dalam ~0.1 detik. Namun bagi bot scraper yang mencoba membuka ribuan tautan, ini akan menguras CPU dan memakan biaya server yang sangat tinggi.

### Lapis 2: Custom Interactive Micro-Task (Slider)
Tantangan fisik non-standar berupa *slider* geser.
- **Keunggulan:** Memvalidasi flag `event.isTrusted === true` (memastikan klik dilakukan oleh interaksi fisik manusia, bukan skrip). Sistem juga merekam telemetri pergerakan kursor (*pointermove*) untuk memastikan kurva koordinatnya natural dan bukan garis lurus sintetis buatan *headless browser* (seperti Puppeteer).

### Lapis 3: Time-Delayed Client-Side Decryption
Menahan eksekusi koneksi beberapa detik sebelum merekonstruksi kunci dekripsi.
- **Keunggulan:** Memblokir scraper HTTP biasa. Bot dipaksa menunggu, yang akan memicu *timeout* pada skrip mereka atau memboroskan pemakaian memori server bot.

---

## ⚡ Arsitektur Serverless & Stateless (Zero Database)

ZeroTrace dirancang untuk berjalan di atas infrastruktur serverless (seperti Vercel) **tanpa menggunakan database eksternal (100% Stateless)**.

1. **State Machine Berbasis Kriptografi:** Karena serverless tidak menyimpan memori antar-request, ZeroTrace menggunakan enkripsi **AES-256-GCM**.
2. **Token Payload:** Setiap data sesi (tujuan URL asli, daftar tantangan yang harus dilewati, dan batas waktu) dikunci menjadi ciphertext yang ditandatangani. Klien/browser tidak bisa membaca atau mengubahnya.
3. **Validasi Bertahap:** Setelah pengunjung menyelesaikan satu tahap (misal PoW), server memvalidasinya dan mengeluarkan token baru untuk tahap selanjutnya (Slider), hingga akhirnya token final diterbitkan untuk merilis URL asli. Bot tidak bisa "melompat" langsung ke tahap akhir.

---

## 📂 Struktur Repositori

```text
zerotrace/
├── api/
│   ├── _crypto.js       # Core enkripsi AES-256-GCM (Stateless Engine)
│   ├── create.js        # Generator & enkripsi URL tujuan
│   ├── init.js          # Endpoint inisialisasi pipeline tantangan acak
│   ├── verify.js        # Endpoint validasi komputasi & telemetri
│   └── resolve.js       # Endpoint dekripsi & rilis URL tujuan akhir
├── public/
│   ├── index.html       # Antarmuka pembuatan tautan (Creator Dashboard)
│   └── gate.html        # Antarmuka gerbang verifikasi pengunjung
├── package.json         
└── vercel.json          # Konfigurasi routing rewrite (/s/:token -> /gate.html)
```

---

## 🚀 Panduan Deployment (Vercel)

Proyek ini siap di-deploy secara instan ke Vercel (Gratis di tier Hobby).

### Langkah 1: Push ke GitHub
Buat repositori baru di GitHub dan dorong kode sumber ini:

```bash
git init
git add .
git commit -m "feat: initial commit zerotrace by noxm007"
git branch -M main
git remote add origin [https://github.com/](https://github.com/)<username-github-kamu>/zerotrace.git
git push -u origin main
```

### Langkah 2: Import di Vercel
1. Buka dashboard Vercel.
2. Klik **Add New...** > **Project**.
3. Import repositori **zerotrace** dari akun GitHub Anda.

### Langkah 3: Set Environment Variable (Wajib!)
Sebelum menekan tombol Deploy, buka menu Environment Variables dan tambahkan variabel berikut:
- **Key:** `APP_SECRET`
- **Value:** Masukkan string acak yang sangat kuat minimal 32 karakter (Contoh: `7f8a9b2c3d4e5f60112233445566778899aabbccddeeff00`).

> ⚠️ **Penting:** Ini adalah kunci master enkripsi AES-256. Jika kunci ini hilang atau diubah, semua tautan terenkripsi yang sudah Anda buat sebelumnya tidak akan bisa dibuka. Jangan bagikan kunci ini.

### Langkah 4: Deploy
Klik **Deploy**. Setelah build selesai, domain Vercel Anda sudah siap digunakan untuk mengamankan tautan dari pantauan bot.

---

## 🛠️ Pengujian Lokal

Untuk menjalankan dan memodifikasi ZeroTrace di komputer lokal:

1. Pastikan Anda telah menginstal Node.js dan Vercel CLI.
2. Clone repositori ini.
3. Jalankan perintah berikut di terminal:

```bash
npx vercel dev
```

Server lokal akan berjalan di `http://localhost:3000`. Anda bisa langsung membuat dan menguji tautan terenkripsi dari browser Anda.
