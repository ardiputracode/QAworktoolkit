/**
 * editor-init.js
 * EDITOR MODULE - ADVANCED OBSERVABILITY VERSION (FIXED IMAGE PICKER)
 *
 * TUJUAN UTAMA:
 * 1. Mengubah textarea menjadi editor TinyMCE yang canggih.
 * 2. SINKRONISASI TEMA: Mengikuti Dark/Light mode website secara otomatis.
 * 3. FIXED IMAGE PICKER: Menjamin tombol 'Browse' di menu bar dan 'quickimage'
 *    berjalan lancar sesuai referensi script user.
 */

console.log('%c[System] Editor Module: File Loaded ✅', 'color: #0284c7; font-weight: bold;');

document.addEventListener('DOMContentLoaded', () => {
  console.log(
    '%c[System] Editor Module: Starting Initialization... ⚙️',
    'color: #f59e0b; font-weight: bold;'
  );

  /**
   * DESAIN INTERIOR (CSS untuk di dalam editor)
   */
  const tinyMceStyle = `
    body {
      --bg-editor: #ffffff;
      --text-editor: #0f172a;
      --link-color: #4f46e5;
      --blockquote-border: #0284c7;
      --blockquote-bg: rgba(2, 132, 199, 0.05);
      --blockquote-text: #475569;
      --code-bg: #f1f5f9;
      --code-border: rgba(0, 0, 0, 0.05);
      --table-border: rgba(0, 0, 0, 0.1);
      --table-th-bg: #f8fafc;

      background-color: var(--bg-editor) !important;
      color: var(--text-editor) !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.55;
      margin: 1rem;
      -webkit-font-smoothing: antialiased;
      transition: background-color 0.3s ease, color 0.3s ease !important;
    }

    body.dark-mode {
      --bg-editor: #0e0f13;
      --text-editor: #f8fafc;
      --link-color: #818cf8;
      --blockquote-border: #38bdf8;
      --blockquote-bg: rgba(56, 189, 248, 0.05);
      --blockquote-text: #94a3b8;
      --code-bg: #1e2028;
      --code-border: rgba(255, 255, 255, 0.07);
      --table-border: rgba(255, 255, 255, 0.12);
      --table-th-bg: #16181d;
    }

    a { color: var(--link-color) !important; text-decoration: none; }
    blockquote {
      border-left: 4px solid var(--blockquote-border) !important;
      margin: 0 0 1.5rem 0; padding: 0.5rem 1rem;
      color: var(--blockquote-text) !important;
      font-style: italic; background: var(--blockquote-bg) !important;
      border-radius: 0 8px 8px 0;
    }

    code {
      background-color: var(--code-bg) !important; padding: 0.2rem 0.4rem;
      border-radius: 4px; font-family: 'JetBrains Mono', monospace;
      font-size: 0.9em; color: var(--link-color) !important;
      border: 1px solid var(--code-border) !important;
    }

    table { border-collapse: collapse; width: 100%; border-radius: 8px; overflow: hidden; }
    table td, table th { border: 1px solid var(--table-border) !important; padding: 0.75rem; }
    table th { background-color: var(--table-th-bg) !important; font-weight: 600; text-align: left; }
  `;

  // Target ID dari file asli kamu
  const targetIds = [
    'audio-highlights',
    'general-highlights',
    'update-follow-up',
    'questions',
    'milestones',
    'tvb-content',
    'heatmap-content',
    'platforms-tracking',
  ];

  const selector = targetIds.map((id) => `#${id}`).join(', ');
  const editorInstances = new Set();

  function isDarkTheme() {
    return (
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      document.body.getAttribute('data-theme') === 'dark'
    );
  }

  function applyEditorTheme(editor) {
    const body = editor.getBody();
    if (!body) return;
    body.classList.toggle('dark-mode', isDarkTheme());
  }

  try {
    tinymce.init({
      license_key: 'gpl',
      promotion: false,
      branding: false,
      selector: selector,
      height: 300,
      menubar: 'file edit view insert format tools table help',
      plugins: [
        'advlist',
        'autoresize',
        'lists',
        'link',
        'image',
        'table',
        'emoticons',
        'searchreplace',
        'visualblocks',
        'code',
        'wordcount',
      ],
      toolbar:
        'undo redo | blocks fontsize | forecolor backcolor | removeformat | bold italic underline | bullist numlist | outdent indent | alignleft aligncenter alignright alignjustify | quickimage table | emoticons | code',
      toolbar_mode: 'sliding',
      skin: 'oxide',
      content_css: 'default',
      content_style: tinyMceStyle,
      statusbar: true,

      // --- BAGIAN PERBAIKAN (Sesuai Referensi Kamu) ---
      file_picker_types: 'image',
      file_picker_callback: function (callback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = () => {
          const file = input.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = () => {
            // Mengirimkan hasil ke callback agar dialog terisi otomatis
            callback(reader.result, { alt: file.name });
          };
          reader.readAsDataURL(file);
        };
        input.click();
      },

      setup(editor) {
        // Sinkronisasi tema saat inisialisasi
        editor.on('init', () => {
          editorInstances.add(editor);
          applyEditorTheme(editor);
          console.log(
            `%c[Action] TinyMCE Editor Ready: ${editor.id} ✅`,
            'color: #8b5cf6; font-weight: bold;'
          );

          const element = editor.getElement();
          if (element.hasAttribute('readonly')) {
            editor.mode.set('readonly');
          }
        });

        // Penting agar data masuk ke textarea asli saat disimpan/dikirim
        editor.on('change input undo redo keyup', () => {
          editor.save();
        });

        editor.on('remove', () => {
          editorInstances.delete(editor);
        });

        // Tombol Quick Image (Menggunakan logika yang sama dengan referensi kamu)
        editor.ui.registry.addButton('quickimage', {
          icon: 'image',
          tooltip: 'Insert Image Fast',
          onAction() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';

            input.onchange = () => {
              const file = input.files[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = () => {
                editor.insertContent(`<img src="${reader.result}" alt="${file.name}" />`);
              };
              reader.readAsDataURL(file);
            };
            input.click();
          },
        });
      },
    });

    console.log(
      '%c[System] Editor Module: Initialization Complete! 🚀',
      'color: #10b981; font-weight: bold;'
    );
  } catch (error) {
    console.error(
      '%c[Error] Editor Module: Initialization Failed! ❌',
      'color: #ef4444; font-weight: bold;',
      error
    );
  }

  // --- TAHAP 4: SINKRONISASI TEMA (MutationObserver) ---
  let syncScheduled = false;
  function syncAllEditorThemes() {
    if (syncScheduled) return;
    syncScheduled = true;
    requestAnimationFrame(() => {
      syncScheduled = false;
      editorInstances.forEach((editor) => {
        try {
          applyEditorTheme(editor);
        } catch (e) {}
      });
    });
  }

  const observer = new MutationObserver((mutations) => {
    if (mutations.some((m) => m.attributeName === 'data-theme')) {
      syncAllEditorThemes();
    }
  });

  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
});
