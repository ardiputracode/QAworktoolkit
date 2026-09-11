# QA Toolkit

## Local AI-Assisted Quality Assurance Productivity Tool

---

# 1. Project Overview

QA Toolkit adalah aplikasi desktop yang dirancang untuk membantu QA engineer menyelesaikan pekerjaan reporting dan dokumentasi bug secara lebih cepat dengan memanfaatkan AI dan integrasi Jira.

Aplikasi ini membantu QA engineer dalam:

- Menyusun QA Progress Report dengan mengisi form yang sudah disediakan
- Mengambil data pendukung dari Jira melalui integrasi API
- Menggabungkan input manual dan data Jira menjadi report yang tersusun rapi
- Mengubah catatan bug mentah menjadi bug description terstruktur dengan bantuan AI
- Mengurangi pekerjaan manual yang berulang
- Meningkatkan konsistensi output QA

QA Toolkit dikembangkan untuk menjawab real-world QA challenge dengan memanfaatkan AI secara praktis untuk meningkatkan produktivitas QA.

QA Toolkit direncanakan sebagai aplikasi desktop Windows yang diinstall pada PC pengguna menggunakan installer.

## Konsep Utama

> Satu aplikasi lokal untuk membantu QA menyusun QA Progress Report berbasis Jira dan mengubah catatan bug menjadi bug description yang siap dipaste ke Jira dengan bantuan AI.

---

# 2. Real World Challenge

## Problem Statement

Dalam aktivitas QA sehari-hari terdapat beberapa pekerjaan yang bersifat berulang dan administratif.

Contohnya:

- Menyusun QA Progress Report secara manual
- Mengambil data dari Jira untuk dimasukkan ke dalam report
- Menggabungkan data Jira dengan informasi yang ditulis secara manual
- Menyusun bug description dari catatan testing
- Memperbaiki typo dan kalimat yang tidak lengkap
- Menyesuaikan format bug report agar lebih mudah digunakan di Jira

Bug yang ditemukan saat testing juga tidak selalu dicatat dalam bentuk kalimat yang lengkap.

Contoh:

```text
login error after click button
sometimes blank page
tested chrome edge
```

Catatan seperti ini cukup untuk mengingat masalah yang ditemukan, tetapi masih membutuhkan pekerjaan tambahan sebelum dapat digunakan sebagai bug description.

---

# 3. Impact

Pekerjaan manual tersebut dapat menyebabkan:

- Waktu penyusunan report menjadi lebih lama
- QA perlu melakukan copy-paste data dari beberapa tempat
- Informasi report perlu dirapikan secara manual
- Penyusunan bug description membutuhkan waktu tambahan
- Format output dapat berbeda-beda

Tujuan QA Toolkit adalah mengurangi pekerjaan administratif tersebut sehingga QA dapat lebih fokus pada aktivitas testing, analysis, dan validation.

---

# 4. Proposed Solution

QA Toolkit menggabungkan:

- Form-based QA reporting
- Jira integration
- AI-assisted bug report preparation
- Local data storage
- Automatic draft saving
- Secure credential management
- Installer-based desktop deployment

## Solution 1 — Faster QA Reporting

QA engineer mengisi form report yang sudah disediakan.

Jira Filter URL dapat digunakan untuk mengambil data pendukung secara otomatis.

Aplikasi kemudian menggabungkan:

```text
Manual Input
     +
Jira Data
     |
     v
QA Progress Report
```

Hasilnya ditampilkan dalam live preview dan dapat digunakan untuk kebutuhan reporting project.

---

## Solution 2 — AI-assisted Bug Report Preparation

QA engineer dapat memasukkan catatan bug dalam bentuk bebas.

Contohnya:

```text
login error after click button
sometimes blank page
tested chrome edge
```

Input tersebut dikirim ke Open WebUI API untuk diproses oleh AI.

AI membantu mengubah catatan tersebut menjadi bug description yang lebih terstruktur dan siap dipaste ke Jira.

---

## Solution 3 — Local Productivity Workflow

Draft pekerjaan disimpan secara lokal pada perangkat pengguna.

Aplikasi tidak membutuhkan server khusus milik QA Toolkit.

Data utama tetap berada pada PC pengguna.

---

# 5. AI Adoption Strategy

QA Toolkit menggunakan AI sebagai bagian dari solusi untuk menyelesaikan real-world QA challenge, bukan hanya sebagai fitur tambahan.

## AI sebagai Productivity Enabler

AI membantu QA dalam:

- Mengubah catatan bug mentah menjadi struktur yang lebih jelas
- Membantu menyusun bug description
- Memperbaiki typo
- Membantu memahami bahasa campuran
- Membantu menyusun informasi berdasarkan input yang tersedia
- Menghasilkan format bug description yang siap dipaste ke Jira

AI tidak dimaksudkan untuk menentukan apakah suatu bug benar-benar valid.

---

## Human + AI Collaboration

Pendekatan yang digunakan:

```text
QA Engineer
     |
     | Raw Information
     v
    AI
     |
     | Structured Draft
     v
QA Engineer
     |
     | Review & Validation
     v
Final Output
```

AI membantu proses transformasi dan formatting.

QA engineer tetap bertanggung jawab terhadap:

- Validasi actual behavior
- Expected behavior
- Severity
- Business impact
- Kebenaran informasi
- Keputusan akhir mengenai bug

---

# 6. Application Scope

## Module 1 — Jira-connected QA Report Builder

### Tujuan

Membantu QA menyusun **QA Progress Report untuk project** dengan mengisi form dan mengambil data pendukung dari Jira.

### Input

- Informasi project
- Informasi progress
- Catatan QA
- Jira Filter URL
- Rich text content

### Jira Integration

Jira Filter URL digunakan sebagai sumber data.

Aplikasi dapat mengambil data yang diperlukan melalui Jira Cloud API.

Data Jira yang digunakan akan disesuaikan dengan kebutuhan report.

Contohnya dapat mencakup:

- Jumlah issue
- Status issue
- Informasi issue berdasarkan filter

### Report Workflow

```text
User mengisi form
        |
        v
User memasukkan Jira Filter URL
        |
        v
Fetch data dari Jira
        |
        v
Gabungkan data Jira + input manual
        |
        v
Live Preview
        |
        v
QA Progress Report
```

### Auto Save

Input report disimpan secara otomatis ketika user mengetik.

Tujuannya untuk mengurangi risiko kehilangan draft pekerjaan.

```text
User Typing
     |
     v
Debounce
     |
     v
Save to IndexedDB
     |
     v
Draft Saved
```

Auto-save tidak berarti setiap keystroke langsung melakukan operasi database.

Implementasi akan menggunakan mekanisme debounce agar operasi penyimpanan tidak dilakukan terlalu sering.

### Output

> QA Progress Report untuk project yang tersusun rapi dan siap digunakan.

Output dapat dicopy untuk digunakan dalam email atau media reporting yang dibutuhkan.

---

## Module 2 — AI Bug Report Formatter

### Tujuan

Mengubah catatan bug mentah menjadi **bug description yang terstruktur dan siap dipaste ke Jira**.

### Input

Input tidak harus berupa kalimat yang sempurna.

Dapat berupa:

- Kalimat tidak lengkap
- Typo
- Bahasa Indonesia
- Bahasa Inggris
- Bahasa campuran
- Catatan singkat
- Informasi testing yang belum terstruktur

Contoh:

```text
login error after click button
sometimes blank page
tested chrome edge
```

### Processing Flow

```text
Raw Bug Notes
      |
      v
Open WebUI API
      |
      v
AI Processing
      |
      v
Structured Bug Description
      |
      v
Review by QA
      |
      v
Copy to Jira
```

### Output

Output berupa **bug description yang sudah disusun dan diformat sehingga siap dipaste ke Jira**.

Contoh struktur:

```text
Summary

Description

Environment

Steps to Reproduce

Actual Result

Expected Result

Additional Notes
```

QA engineer tetap melakukan review sebelum hasil digunakan pada Jira.

---

# 7. Application Architecture

```text
                    QA Toolkit
                        |
                        v
              Installed on Windows
                        |
                        v
          Electron Application Framework
                        |
       +----------------+----------------+
       |                                 |
       v                                 v
Frontend Layer                   Local Data Layer
HTML / CSS / JS                  IndexedDB
                                 OS Credential Storage
       |
       |
       +----------------+
                        |
                        v
             External Integration Layer
                        |
             +----------+----------+
             |                     |
             v                     v
       Jira Cloud API       Open WebUI API
```

---

# 8. Technology Stack

## Application Framework — Electron

Electron digunakan untuk membangun QA Toolkit sebagai aplikasi desktop Windows menggunakan teknologi web seperti HTML, CSS, dan JavaScript.

### License & Cost

Electron merupakan framework open-source dan dapat digunakan secara gratis.

Tidak diperlukan biaya lisensi Electron untuk membuat aplikasi desktop menggunakan framework tersebut.

### Alasan Pemilihan

- Dapat menghasilkan aplikasi desktop Windows
- Menggunakan teknologi web yang relatif mudah dipelajari
- Mendukung integrasi dengan fitur lokal sistem operasi
- Cocok untuk aplikasi local-first
- Mendukung distribusi aplikasi melalui installer
- Memungkinkan pengelolaan aplikasi dan versi secara lebih terstruktur
- Memungkinkan pengembangan mekanisme update aplikasi di masa depan
- Memungkinkan frontend dan desktop functionality berada dalam satu aplikasi

### Security Consideration

Electron menyediakan fondasi untuk desktop application, tetapi keamanan aplikasi tetap bergantung pada implementasinya.

QA Toolkit akan menggunakan prinsip:

```text
Frontend
   |
   | Secure IPC
   v
Electron Main Process
   |
   +-- OS Credential Storage
   +-- Local System Access
   +-- External API Communication
```

Akses sistem operasi tidak diberikan secara bebas kepada frontend.

Security configuration akan menjadi bagian dari proses development dan testing.

---

# 9. Frontend

## HTML + CSS + JavaScript

Teknologi frontend awal:

- HTML
- CSS
- JavaScript

### Alasan Pemilihan

- Simple
- Mudah dipahami
- Ringan
- Tidak membutuhkan framework kompleks pada tahap awal
- Cocok untuk project yang dikembangkan dengan bantuan AI
- Memudahkan developer memahami seluruh bagian aplikasi

React atau framework frontend lainnya belum menjadi kebutuhan pada tahap awal.

Framework tambahan dapat dipertimbangkan apabila kompleksitas aplikasi meningkat dan manfaatnya sudah jelas.

---

# 10. Rich Text Editor

## TinyMCE

TinyMCE digunakan sebagai **rich text editor** untuk memberikan kemampuan formatting pada isi QA Progress Report.

### Digunakan untuk

- Menulis teks
- Bold / italic
- List
- Heading
- Basic text formatting
- Formatting konten report

TinyMCE tidak digunakan sebagai storage atau backend aplikasi.

### License & Cost Consideration

TinyMCE memiliki opsi open-source/self-hosted serta produk dan fitur tambahan yang memiliki lisensi berbeda.

Untuk kebutuhan QA Toolkit, penggunaan akan difokuskan pada kemampuan rich text editing yang diperlukan.

Jika menggunakan versi atau konfigurasi self-hosted yang sesuai dengan kebutuhan project, editor tidak perlu bergantung pada layanan cloud TinyMCE untuk proses editing dasar.

### Security Consideration

Karena editor digunakan secara lokal:

```text
User
 |
 v
TinyMCE
 |
 v
Local Application
 |
 v
IndexedDB
```

Konten report tidak perlu dikirim ke server TinyMCE hanya untuk proses editing lokal.

Dependency dan versi TinyMCE tetap perlu diperbarui dan diperiksa selama maintenance aplikasi.

---

# 11. Local Data Management

## IndexedDB

IndexedDB digunakan sebagai local database untuk menyimpan data non-rahasia.

### Mengapa IndexedDB?

QA Toolkit membutuhkan penyimpanan untuk draft pekerjaan.

Karena draft dapat memiliki data yang lebih kompleks dibandingkan sekadar key-value sederhana, IndexedDB lebih sesuai dibandingkan `localStorage`.

### Dibandingkan localStorage

IndexedDB memiliki beberapa keuntungan:

- Mendukung data yang lebih besar
- Mendukung struktur data yang lebih kompleks
- Asynchronous
- Cocok untuk penyimpanan record
- Cocok untuk draft pekerjaan
- Tersedia secara native pada browser/Electron

Secara sederhana:

```text
localStorage
    |
    +-- Cocok untuk data kecil dan sederhana


IndexedDB
    |
    +-- Cocok untuk local application data
    +-- Report Draft
    +-- Bug Draft
```

---

# 12. IndexedDB Structure

QA Toolkit menggunakan IndexedDB untuk menyimpan draft pekerjaan secara lokal.

Struktur awal:

```text
QA Toolkit Database

├── report_drafts
└── bug_drafts
```

## report_drafts

Menyimpan draft QA Progress Report yang sedang dikerjakan.

## bug_drafts

Menyimpan input bug yang sedang dikerjakan.

---

# 13. Secure Credential Management

API token tidak disimpan di IndexedDB.

Credential seperti:

```text
Jira API Token
Open WebUI Token
```

disimpan menggunakan:

## OS Credential Storage

Pada Windows, target implementasinya adalah mekanisme secure credential storage seperti Windows Credential Manager.

### Mengapa OS Credential Storage?

Credential berbeda dengan data aplikasi biasa.

IndexedDB digunakan untuk:

```text
Report Draft
Bug Draft
```

Sedangkan credential disimpan terpisah:

```text
API Token
     |
     v
OS Credential Storage
```

### Keuntungan

- Memisahkan secret dari application data
- Menghindari penyimpanan token sebagai plain text di database aplikasi
- Memanfaatkan mekanisme keamanan operating system
- Credential tidak perlu masuk ke file backup
- Credential dapat dikelola secara terpisah dari data aplikasi

### Credential Flow

```text
User memasukkan token
        |
        v
Electron
        |
        v
OS Credential Storage
        |
        v
Token tersimpan
```

Saat API membutuhkan token:

```text
Application
     |
     v
Request Credential
     |
     v
OS Credential Storage
     |
     v
Token
     |
     +---------> Jira Cloud API
     |
     +---------> Open WebUI API
```

---

# 14. Auto Save System

Auto-save digunakan untuk mengurangi risiko kehilangan pekerjaan.

## Report Builder

```text
User mengetik
      |
      v
Debounce
      |
      v
Save to IndexedDB
      |
      v
report_drafts
```

## Bug Formatter

```text
User mengetik
      |
      v
Debounce
      |
      v
Save to IndexedDB
      |
      v
bug_drafts
```

Auto-save tidak berarti setiap keystroke langsung melakukan operasi database.

Implementasi akan menggunakan mekanisme debounce agar operasi penyimpanan tidak dilakukan terlalu sering.

---

# 15. Backup & Restore

QA Toolkit direncanakan memiliki fitur export dan import untuk draft yang tersimpan secara lokal.

## Export

Contoh:

```text
backup.json

✓ QA Progress Report Drafts
✓ Bug Drafts

✗ API Tokens
```

## Mengapa token tidak ikut backup?

Credential memiliki perlakuan keamanan yang berbeda dari data aplikasi.

Data draft dapat dipindahkan ke PC lain melalui fitur export/import, sedangkan API token tetap disimpan secara terpisah menggunakan OS Credential Storage.

Pada PC baru, user perlu memasukkan credential kembali.

---

# 16. External Integration

## Jira Cloud API

Jira digunakan sebagai sumber data untuk QA Progress Report.

### Fungsi

- Mengambil data berdasarkan Jira Filter
- Mengambil informasi issue yang diperlukan report
- Mengambil jumlah issue sesuai kebutuhan
- Menyediakan data pendukung untuk Report Builder

Jira tidak menjadi tempat penyimpanan utama draft aplikasi.

---

## Open WebUI API

Open WebUI digunakan sebagai AI processing endpoint.

### Fungsi

- Memproses raw bug notes
- Membantu memperbaiki typo
- Membantu memahami bahasa campuran
- Menyusun bug description
- Menghasilkan struktur yang siap dipaste ke Jira

AI processing bergantung pada konfigurasi model yang tersedia pada Open WebUI.

---

# 17. Development Environment

## Code Editor — VSCodium

VSCodium digunakan sebagai code editor utama.

### Alasan Pemilihan

- Open-source
- Berbasis VS Code
- Mengurangi ketergantungan pada distribusi proprietary tertentu
- Tidak menggunakan branding dan telemetry Microsoft dari distribusi resmi VS Code
- Mendukung extension development
- Mendukung workflow HTML, CSS, JavaScript, Electron, dan Git

### Digunakan untuk

- Coding
- Debugging
- Running application
- Git workflow
- AI-assisted development

### Security Note

VSCodium sendiri bukan jaminan bahwa seluruh development environment bebas dari telemetry.

Extension dan tools tambahan tetap perlu dievaluasi berdasarkan kebutuhan security dan privacy project.

---

# 18. Version Control

## Git + GitLab

Git digunakan sebagai version control system.

GitLab digunakan sebagai remote repository.

### Fungsi

- Source code management
- Version history
- Backup
- Change tracking
- Collaboration
- Rollback

### Workflow

```text
VSCodium
    |
    v
Local Git Repository
    |
    v
GitLab Repository
```

GitLab digunakan sebagai development infrastructure.

QA Toolkit tetap dapat berjalan secara lokal tanpa bergantung pada GitLab ketika digunakan oleh end user.

---

# 19. AI-Assisted Development

AI digunakan sebagai development assistant dari tahap ide sampai implementasi.

## 1. Ideation & Planning

AI membantu:

- Brainstorming ide fitur
- Mencari alternatif solusi
- Membandingkan teknologi
- Menentukan prioritas
- Membuat roadmap
- Mengidentifikasi risiko
- Mengevaluasi trade-off

---

## 2. Software Design

AI membantu:

- Architecture planning
- Folder structure
- Database design
- Application flow
- API integration planning
- Technical documentation

---

## 3. Development

AI membantu:

- Generate kode awal
- Menjelaskan kode
- Debugging
- Refactoring
- Dokumentasi
- Test code

---

## 4. Problem Solving

AI membantu:

- Menganalisis error
- Mencari kemungkinan penyebab
- Memberikan alternatif solusi
- Membantu memahami dependency atau API error

---

## AI sebagai Development Partner

AI digunakan bukan hanya untuk menghasilkan kode.

AI juga membantu proses:

```text
Idea
  |
  v
Explore
  |
  v
Design
  |
  v
Implement
  |
  v
Test
  |
  v
Improve
```

Namun keputusan akhir tetap membutuhkan evaluasi developer.

---

# 20. Human Validation

Walaupun AI digunakan secara intensif, hasil AI tidak langsung dianggap benar.

Developer/QA tetap melakukan:

- Review kode
- Security review
- Testing
- API validation
- Output validation
- Functional validation

Khusus untuk bug report:

```text
AI Generated Draft
        |
        v
QA Review
        |
        v
Validated Bug Description
```

---

# 21. MVP Scope

Target MVP:

- Electron desktop application
- Windows installer
- HTML/CSS/JavaScript frontend
- Jira-connected QA Report Builder
- QA Progress Report
- TinyMCE rich text editor
- AI Bug Report Formatter
- Open WebUI integration
- IndexedDB local storage
- Auto-save
- OS Credential Storage
- Export/import draft

---

# 22. Deployment Strategy

QA Toolkit akan didistribusikan sebagai aplikasi desktop Windows menggunakan installer.

## Tujuan Installer

Installer digunakan untuk:

- Menginstall QA Toolkit pada PC pengguna
- Menempatkan application files pada lokasi yang sesuai
- Membuat shortcut aplikasi
- Mempermudah proses instalasi dan penggunaan
- Mengelola versi aplikasi secara lebih terstruktur
- Menjadi fondasi apabila mekanisme update ditambahkan di masa depan

## Application Files dan User Data

Application files dan user data dipisahkan.

```text
Windows PC
    |
    +-- QA Toolkit Application
    |       |
    |       +-- Installed Application Files
    |
    +-- Local User Data
            |
            +-- IndexedDB
            |
            +-- OS Credential Storage
```

Tujuannya agar perubahan, upgrade, atau reinstall aplikasi tidak secara otomatis dianggap sebagai penghapusan data user.

Implementasi akhir lokasi data akan mengikuti mekanisme penyimpanan yang digunakan Electron dan Windows.

---

# 23. Roadmap Development

## Phase 1 — Prototype

### Target

Membuat konsep aplikasi dasar berjalan.

### Scope

- Setup project
- Electron initialization
- Basic UI
- Form input
- Basic preview
- Git repository
- Initial project structure

---

## Phase 2 — Local Data Layer

### Target

Membangun fondasi penyimpanan lokal.

### Scope

- IndexedDB
- Database structure
- Auto-save
- Draft recovery
- Application settings

---

## Phase 3 — Jira Report Builder

### Target

Menyelesaikan workflow QA Progress Report.

### Scope

- Report form
- Jira Filter input
- Jira Cloud API integration
- Fetch Jira data
- Combine manual input + Jira data
- Live preview
- Copy output

---

## Phase 4 — AI Bug Formatter

### Target

Menambahkan AI-assisted bug report preparation.

### Scope

- Open WebUI API integration
- Prompt design
- Raw bug input
- Structured output
- Jira-ready bug description
- AI result preview
- Copy output

---

## Phase 5 — Desktop Release

### Target

Membuat aplikasi desktop Windows yang siap diinstall dan digunakan.

### Scope

- Production Electron build
- Windows installer creation
- Application installation workflow
- Application shortcut
- OS Credential Storage
- Secure token handling
- Backup and restore
- Upgrade/reinstall validation
- Final testing

---

# 24. Expected Impact

QA Toolkit diharapkan dapat:

- Mengurangi waktu penyusunan QA Progress Report
- Mengurangi pekerjaan administratif yang berulang
- Mempermudah pengambilan data pendukung dari Jira
- Mempermudah penyusunan bug description
- Meningkatkan konsistensi format output QA
- Mengurangi risiko kehilangan draft pekerjaan

---

# 25. Success Criteria

Keberhasilan QA Toolkit akan dilihat dari seberapa baik aplikasi menyelesaikan workflow nyata QA.

## Reporting

QA dapat:

```text
Fill Form
   +
Jira Filter
   |
   v
QA Progress Report
```

dengan pekerjaan manual yang lebih sedikit.

## Bug Report

QA dapat:

```text
Raw Bug Notes
      |
      v
AI Processing
      |
      v
Jira-ready Bug Description
```

dengan tetap melakukan review sebelum digunakan.

## Data Safety

- Draft tersimpan secara lokal
- Token tidak disimpan di IndexedDB
- Token tidak masuk backup
- Credential dikelola melalui OS Credential Storage

## Application Deployment

User dapat:

- Menginstall QA Toolkit menggunakan installer
- Menjalankan aplikasi melalui shortcut Windows
- Menggunakan aplikasi tanpa konfigurasi instalasi yang kompleks
- Melakukan reinstall atau upgrade aplikasi tanpa kehilangan data lokal selama mekanisme penyimpanan tetap kompatibel

---

# 26. Development Notes

Dokumen ini merupakan technical proposal dan development direction awal.

Implementasi akhir dapat mengalami penyesuaian berdasarkan:

- Keterbatasan teknis
- Kemampuan Jira API
- Konfigurasi Open WebUI
- Hasil testing
- Security review
- User feedback
- Prioritas development
- Hasil evaluasi selama kompetisi

Tidak semua detail implementasi harus dipertahankan apabila ditemukan pendekatan yang lebih sederhana, aman, stabil, atau sesuai kebutuhan.

Fitur seperti mekanisme update aplikasi dapat ditambahkan pada pengembangan berikutnya tanpa menjadi bagian wajib dari MVP apabila fondasi deployment dan struktur aplikasi sudah mendukung.

Prinsip utama project tetap dipertahankan:

> Menyelesaikan real-world QA challenge dengan memanfaatkan AI secara praktis, terukur, dan tetap berada dalam kontrol QA engineer.

---

# 27. Conclusion

QA Toolkit adalah:

- Desktop QA productivity application
- Jira-connected QA reporting assistant
- AI-assisted bug report preparation tool
- Local-first QA workflow application
- Installer-based Windows desktop application

Solusi ini menggabungkan:

```text
Structured Input
       +
Jira Data
       +
AI Assistance
       +
Local-first Architecture
       |
       v
More Efficient QA Workflow
```

## Teknologi Utama

```text
HTML
CSS
JavaScript
Electron
TinyMCE
IndexedDB
OS Credential Storage
Git
GitLab
Jira Cloud API
Open WebUI API
```

## Deployment

```text
QA Toolkit Installer
        |
        v
Install on Windows
        |
        v
QA Toolkit
        |
        +-- Local Draft Storage
        +-- Secure Credential Storage
        +-- Jira Cloud Integration
        +-- Open WebUI Integration
```

## Tujuan Akhir

> Membantu QA engineer menyusun QA Progress Report dengan lebih cepat dan mengubah catatan bug menjadi bug description yang siap dipaste ke Jira, dengan memanfaatkan AI untuk mengurangi pekerjaan manual yang berulang.

---

# 28. Final Principle

> AI should assist the QA workflow, not replace QA judgment.

QA Toolkit menempatkan AI sebagai assistant dalam proses transformasi informasi, sementara QA engineer tetap menjadi pihak yang melakukan review, validasi, dan mengambil keputusan akhir.
