# QA Toolkit — Development Log & Updated Roadmap

## Project Status

QA Toolkit saat ini telah menyelesaikan tahap awal **Phase 1 — Prototype**.

Fondasi aplikasi desktop, struktur frontend, navigasi dasar, dan beberapa modul UI sudah berhasil dibuat dan dapat dijalankan melalui Electron.

---

# Development Log

## Phase 1 — Prototype

### Status

> **COMPLETED**

### Environment Setup

Development environment telah disiapkan menggunakan:

- Windows
- VSCodium
- Node.js
- npm
- Git
- Electron

Environment telah diverifikasi melalui:

```text
Node.js   v24.19.0
npm       11.17.0
Git       2.50.1
Electron  v44.0.0
```

---

## Electron Initialization

Electron telah berhasil diinstall dan dikonfigurasi sebagai application framework.

Aplikasi dapat dijalankan menggunakan:

```bash
npm start
```

Electron berhasil membuka window utama QA Toolkit.

---

## Initial Application Structure

Project telah dipisahkan menjadi beberapa bagian utama:

```text
QAworktoolkit
│
├── package.json
├── package-lock.json
│
└── src
    ├── main
    │
    ├── preload
    │
    └── renderer
        ├── HTML
        ├── CSS
        ├── JavaScript
        └── application data
```

Pemisahan ini dibuat sebagai fondasi untuk architecture Electron:

```text
Renderer
   |
   v
Preload
   |
   v
Secure IPC
   |
   v
Electron Main Process
```

---

## Basic UI

Basic user interface QA Toolkit telah dibuat menggunakan:

- HTML
- CSS
- JavaScript

UI telah dapat ditampilkan melalui Electron.

Halaman aplikasi menggunakan konsep Single Page Application.

---

## SPA Navigation

Module:

```text
navigate.js
```

telah dibuat untuk mengelola navigasi antar bagian aplikasi tanpa melakukan reload seluruh halaman.

Konsep:

```text
User memilih menu
        |
        v
navigate.js
        |
        v
Hide current section
        |
        v
Show selected section
```

---

## Theme System

Module:

```text
theme-toggle.js
```

telah dibuat untuk menyediakan:

- Light Mode
- Dark Mode
- Penyimpanan preferensi theme
- Sinkronisasi tampilan theme

Theme pilihan user dapat dipertahankan ketika aplikasi dibuka kembali selama mekanisme penyimpanan yang digunakan masih tersedia.

---

## Rich Text Editor Initialization

Module:

```text
editor-init.js
```

telah dibuat untuk mengintegrasikan TinyMCE.

Fungsi utama:

- Mengubah textarea menjadi rich text editor
- Mendukung formatting text
- Bold
- Italic
- List
- Table
- Formatting lainnya
- Sinkronisasi Dark Mode dan Light Mode

TinyMCE menjadi fondasi rich text editing untuk QA Progress Report.

---

## Project Name Loader

Module:

```text
project-name-loader.js
```

telah dibuat.

Module mengambil daftar project dari:

```text
data.json
```

kemudian memasukkannya ke dropdown project.

Konsep:

```text
data.json
    |
    v
project-name-loader.js
    |
    v
Project Dropdown
```

Dengan pendekatan ini, daftar project tidak perlu ditulis langsung satu per satu di HTML.

---

## Project Type Loader

Module:

```text
project-type-loader.js
```

telah dibuat untuk mengelola daftar tipe project.

Data tipe project juga dapat berasal dari:

```text
data.json
```

Module juga memiliki conditional UI logic.

Contoh:

```text
Project Type
     |
     v
Contains "Update"?
     |
 +---+---+
 |       |
Yes      No
 |       |
 v       v
Show     Hide
Update   Update
Number   Number
```

---

## Git Repository

Git repository telah berhasil dibuat.

Initial project commit juga telah dilakukan.

Git digunakan untuk:

- Version history
- Change tracking
- Rollback
- Development history
- Backup source code
- Repository synchronization

---

# Phase 1 Completion Summary

Phase 1 berhasil menghasilkan fondasi aplikasi:

```text
Windows
   |
   v
Electron
   |
   v
QA Toolkit
   |
   +-- Basic UI
   |
   +-- SPA Navigation
   |
   +-- Theme System
   |
   +-- Project Loader
   |
   +-- Project Type Logic
   |
   +-- TinyMCE Integration
   |
   +-- Modular JavaScript
   |
   +-- Git Version Control
```

Dengan fondasi tersebut, project siap masuk ke tahap penyimpanan data dan workflow aplikasi.

---

# Updated Development Roadmap

# Phase 1 — Prototype

## Status

> **COMPLETED**

## Target

Membuat fondasi aplikasi QA Toolkit dan memastikan aplikasi desktop dapat berjalan melalui Electron.

## Completed Scope

- [x] Development environment setup
- [x] Node.js setup
- [x] npm setup
- [x] Git setup
- [x] Electron installation
- [x] Electron initialization
- [x] Electron window
- [x] Initial project structure
- [x] HTML frontend
- [x] CSS frontend
- [x] JavaScript frontend
- [x] Basic UI
- [x] Single Page Application navigation
- [x] Dark / Light theme
- [x] TinyMCE initialization
- [x] Project name loader
- [x] Project type loader
- [x] Dynamic Update Number field
- [x] Git repository
- [x] Initial Git commit

---

# Phase 2 — Local Data & Core Frontend Workflow

## Status

> **NEXT**

## Target

Membuat aplikasi mulai menyimpan pekerjaan user secara lokal dan menyelesaikan workflow frontend utama sebelum API eksternal diintegrasikan.

## Scope

### IndexedDB Foundation

- [ ] Membuat IndexedDB database
- [ ] Membuat `report_drafts`
- [ ] Membuat `bug_drafts`
- [ ] Membuat database service/module
- [ ] Menentukan versi database
- [ ] Menangani database initialization

Struktur:

```text
QA Toolkit Database
│
├── report_drafts
└── bug_drafts
```

---

### Report Draft Storage

- [ ] Membaca input QA Progress Report
- [ ] Menyimpan report draft ke IndexedDB
- [ ] Update existing draft
- [ ] Recover draft ketika aplikasi dibuka kembali
- [ ] Handle empty draft

---

### Bug Draft Storage

- [ ] Menyimpan raw bug input
- [ ] Menyimpan field Bug Formatter
- [ ] Restore bug draft
- [ ] Handle empty draft

---

### Auto Save

- [ ] Membuat debounce utility
- [ ] Detect perubahan report form
- [ ] Auto-save report
- [ ] Detect perubahan Bug Formatter
- [ ] Auto-save bug draft
- [ ] Menampilkan status saving
- [ ] Menampilkan status saved
- [ ] Error handling ketika save gagal

Workflow:

```text
User Input
    |
    v
Input Event
    |
    v
Debounce
    |
    v
IndexedDB
    |
    v
Draft Saved
```

---

### Draft Recovery

Ketika aplikasi dibuka:

```text
QA Toolkit Start
       |
       v
Check IndexedDB
       |
       v
Draft exists?
       |
   +---+---+
   |       |
  Yes      No
   |       |
   v       v
Restore   Empty
Draft     Form
```

Scope:

- [ ] Load report draft
- [ ] Load bug draft
- [ ] Restore regular inputs
- [ ] Restore dropdown values
- [ ] Restore conditional fields
- [ ] Restore TinyMCE content

---

### QA Progress Report Frontend Workflow

Bagian yang belum diperlukan pada prototype dipindahkan ke Phase 2 agar mulai menjadi workflow yang benar-benar usable.

- [ ] Connect report form dengan JavaScript
- [ ] Collect report form data
- [ ] Generate basic QA Progress Report preview
- [ ] Live preview update
- [ ] Handle TinyMCE content
- [ ] Basic input validation
- [ ] Clear/reset draft workflow

Belum melibatkan Jira.

Flow:

```text
Manual Input
     |
     v
Form State
     |
     v
Preview Generator
     |
     v
QA Progress Report Preview
```

---

### Bug Formatter Frontend Workflow

AI belum digunakan pada Phase 2.

Scope:

- [ ] Raw bug input UI
- [ ] Bug detail inputs
- [ ] Dynamic Steps to Reproduce
- [ ] Basic output/preview container
- [ ] Generate button state
- [ ] Copy button UI
- [ ] Draft persistence

Flow sementara:

```text
Raw Bug Notes
      |
      v
Bug Form State
      |
      v
Draft Storage
```

AI processing tetap dilakukan pada Phase 4.

---

### Application Settings Foundation

- [ ] Membuat Settings UI
- [ ] Menentukan struktur application settings
- [ ] Menyimpan non-secret settings
- [ ] Theme preference integration
- [ ] Menyiapkan field konfigurasi API

API token belum disimpan di IndexedDB.

Credential implementation dilakukan pada tahap release/security.

---

## Phase 2 Completion Criteria

Phase 2 dianggap selesai apabila:

```text
User membuka aplikasi
        |
        v
Mengisi Report / Bug Form
        |
        v
Data tersimpan otomatis
        |
        v
User menutup aplikasi
        |
        v
Membuka kembali
        |
        v
Draft kembali
```

serta QA Progress Report sudah memiliki basic live preview dari manual input.

---

# Phase 3 — Jira-connected QA Report Builder

## Status

> **PLANNED**

## Target

Menghubungkan Report Builder dengan Jira Cloud sehingga data Jira dapat menjadi bagian dari QA Progress Report.

## Scope

- [ ] Jira configuration UI
- [ ] Jira authentication mechanism
- [ ] Jira Filter URL input
- [ ] Parse Jira Filter URL
- [ ] Jira Cloud API integration
- [ ] Fetch Jira issue data
- [ ] Fetch issue count
- [ ] Fetch issue status information
- [ ] Jira API error handling
- [ ] Loading state
- [ ] Connection validation
- [ ] Combine Jira data + manual data
- [ ] Generate QA Progress Report
- [ ] Live preview
- [ ] Copy report output

Workflow:

```text
Manual Input
      +
Jira Filter
      |
      v
Jira Cloud API
      |
      v
Jira Data
      |
      +
Manual Data
      |
      v
Report Generator
      |
      v
QA Progress Report
```

## Completion Criteria

User dapat:

```text
Fill Report Form
      +
Jira Filter
      |
      v
Fetch Jira
      |
      v
Generate
      |
      v
QA Progress Report
```

---

# Phase 4 — AI Bug Report Formatter

## Status

> **PLANNED**

## Target

Mengintegrasikan Open WebUI untuk mengubah catatan bug mentah menjadi structured Jira-ready bug description.

## Scope

- [ ] Open WebUI configuration
- [ ] API endpoint configuration
- [ ] Model selection/configuration
- [ ] API connection testing
- [ ] Prompt design
- [ ] Input normalization
- [ ] AI request
- [ ] AI response processing
- [ ] Loading state
- [ ] Timeout handling
- [ ] Error handling
- [ ] Result validation
- [ ] Structured output
- [ ] Result preview
- [ ] Copy to clipboard

Target structure:

```text
Summary

Description

Environment

Steps to Reproduce

Actual Result

Expected Result

Additional Notes
```

Workflow:

```text
Raw Bug Notes
      |
      v
Open WebUI
      |
      v
AI Model
      |
      v
Structured Draft
      |
      v
QA Review
      |
      v
Jira-ready Bug Description
```

## Completion Criteria

QA dapat memasukkan raw bug notes dan mendapatkan draft structured bug description yang dapat direview sebelum digunakan di Jira.

---

# Phase 5 — Security, Backup & Desktop Release

## Status

> **PLANNED**

## Target

Mempersiapkan QA Toolkit agar aman dan siap didistribusikan sebagai aplikasi Windows melalui installer.

## Secure Credential Storage

- [ ] Implement OS Credential Storage
- [ ] Jira API Token secure storage
- [ ] Open WebUI Token secure storage
- [ ] Retrieve credential through Electron Main Process
- [ ] Secure IPC
- [ ] Prevent secret exposure to renderer
- [ ] Credential deletion/update workflow

Architecture:

```text
Renderer
   |
   v
Preload
   |
   v
Secure IPC
   |
   v
Main Process
   |
   v
OS Credential Storage
```

---

## Backup & Restore

- [ ] Export report drafts
- [ ] Export bug drafts
- [ ] Generate backup JSON
- [ ] Import backup JSON
- [ ] Validate backup format
- [ ] Restore data
- [ ] Exclude credential/token

Backup:

```text
backup.json

✓ report_drafts
✓ bug_drafts

✗ Jira API Token
✗ Open WebUI Token
```

---

## Electron Production Configuration

- [ ] Production configuration
- [ ] Application name
- [ ] Application version
- [ ] App icon
- [ ] Windows metadata
- [ ] Production build testing

---

## Windows Installer

- [ ] Configure Electron packaging tool
- [ ] Generate installer
- [ ] Installation test
- [ ] Application shortcut
- [ ] Start Menu integration
- [ ] Uninstall workflow
- [ ] Reinstall test
- [ ] Upgrade test

Workflow:

```text
QA Toolkit Installer
        |
        v
Windows Installation
        |
        v
QA Toolkit
        |
        +-- Application Files
        |
        +-- User Data
```

---

## Final Security Validation

- [ ] Verify `nodeIntegration: false`
- [ ] Verify `contextIsolation: true`
- [ ] Review preload API exposure
- [ ] Review IPC channels
- [ ] Review token handling
- [ ] Review external API requests
- [ ] Review dependencies
- [ ] Verify secrets are not stored in IndexedDB
- [ ] Verify secrets are not included in backup

---

## Final Functional Testing

- [ ] QA Progress Report workflow
- [ ] Jira API workflow
- [ ] Bug Formatter workflow
- [ ] AI workflow
- [ ] Auto-save
- [ ] Draft recovery
- [ ] Backup
- [ ] Restore
- [ ] Theme
- [ ] TinyMCE
- [ ] Installation
- [ ] Reinstallation
- [ ] Upgrade validation
- [ ] Error scenarios

---

# Future Development — Post MVP

Fitur berikut tidak menjadi requirement utama MVP.

Dapat ditambahkan setelah versi awal QA Toolkit stabil.

## Auto Update

Potential scope:

```text
Installed QA Toolkit
       |
       v
Check Update
       |
       v
New Version Available
       |
       v
Download
       |
       v
Update Application
```

## Cloud Sync

Potential architecture:

```text
Local IndexedDB
      |
      v
Sync Service
      |
      v
Cloud Database
```

## Authentication

Potential feature:

- User login
- Google authentication
- Per-user cloud data
- Multi-device synchronization

## Additional Jira Automation

Potential feature:

- Additional Jira data sources
- More advanced Jira filters
- Issue grouping
- Status analytics
- Report automation

---

# Current Project Position

```text
PHASE 1
Prototype
   |
   | COMPLETED
   v
========================
        CURRENT
========================
   |
   v
PHASE 2
Local Data &
Core Frontend Workflow
   |
   v
PHASE 3
Jira Integration
   |
   v
PHASE 4
AI Integration
   |
   v
PHASE 5
Security + Installer
   |
   v
MVP Release
```

---

# Next Development Target

Target berikutnya adalah:

> **Phase 2 — membuat IndexedDB sebagai fondasi local storage dan memastikan pekerjaan QA dapat tersimpan serta dipulihkan ketika aplikasi dibuka kembali.**

Urutan implementasi Phase 2 yang direkomendasikan:

```text
1. IndexedDB initialization
        |
        v
2. report_drafts
        |
        v
3. bug_drafts
        |
        v
4. Save / Load functions
        |
        v
5. Report auto-save
        |
        v
6. Bug auto-save
        |
        v
7. Draft recovery
        |
        v
8. TinyMCE recovery
        |
        v
9. QA Report live preview
        |
        v
10. Phase 2 validation
```

Prinsipnya:

> Phase 2 tidak menambah Jira atau AI terlebih dahulu. Phase 2 memastikan aplikasi memiliki local data foundation dan frontend workflow yang stabil sebelum external integration ditambahkan.