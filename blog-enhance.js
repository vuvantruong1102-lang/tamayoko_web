/* ============================================================
 * blog-enhance.js
 * Tự động chạy trên tất cả trang bài viết yokool.vn
 *
 * Tính năng:
 *   1. Mục lục tự động (TOC) - sticky bên phải bài viết
 *   2. Reading progress bar - thanh ngang đỉnh màn hình
 *   3. Image lightbox - click ảnh để mở fullscreen + zoom
 *   4. Smooth scroll cho anchor links
 *
 * Yêu cầu: trang phải có element .article-body
 * ============================================================ */
(function () {
  'use strict';

  // Chỉ chạy trên trang article (có .article-body)
  const articleBody = document.querySelector('.article-body');
  if (!articleBody) return;

  // ========================================================
  // 1. Reading Progress Bar
  // ========================================================
  function initReadingProgress() {
    const bar = document.createElement('div');
    bar.id = 'reading-progress-bar';
    bar.setAttribute('aria-hidden', 'true');
    Object.assign(bar.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '0%',
      height: '3px',
      background: 'linear-gradient(90deg, #DC143B 0%, #ff4d6d 100%)',
      zIndex: '9999',
      transition: 'width 0.1s ease-out',
      pointerEvents: 'none',
    });
    document.body.appendChild(bar);

    function update() {
      const article = document.querySelector('.article-body');
      if (!article) return;
      const articleTop = article.getBoundingClientRect().top + window.scrollY;
      const articleHeight = article.offsetHeight;
      const winHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // Tính tiến độ đọc trong vùng bài viết
      const startReading = articleTop - winHeight / 3;
      const endReading = articleTop + articleHeight - winHeight / 2;
      const progress = Math.max(0, Math.min(1, (scrollY - startReading) / (endReading - startReading)));
      bar.style.width = (progress * 100) + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  // ========================================================
  // 2. Table of Contents (TOC)
  // ========================================================
  function initTOC() {
    const headings = articleBody.querySelectorAll('h2, h3');
    if (headings.length < 3) return; // bài ngắn không cần TOC

    // Gán id cho mỗi heading nếu chưa có
    headings.forEach((h, i) => {
      if (!h.id) {
        h.id = 'h-' + slugify(h.textContent || '') + '-' + i;
      }
    });

    // Tạo TOC element
    const toc = document.createElement('aside');
    toc.id = 'article-toc';
    toc.setAttribute('aria-label', 'Mục lục bài viết');
    toc.innerHTML = `
      <div class="toc-header">
        <span class="toc-icon" aria-hidden="true">≡</span>
        <span class="toc-title">Mục lục</span>
        <button class="toc-toggle" aria-label="Ẩn/hiện mục lục">−</button>
      </div>
      <ol class="toc-list"></ol>
    `;
    const list = toc.querySelector('.toc-list');

    headings.forEach((h) => {
      const li = document.createElement('li');
      li.className = 'toc-item toc-' + h.tagName.toLowerCase();
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(h.id);
        if (target) {
          const top = target.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top, behavior: 'smooth' });
          history.pushState(null, '', '#' + h.id);
        }
      });
      li.appendChild(a);
      list.appendChild(li);
    });

    // Toggle collapse
    const toggleBtn = toc.querySelector('.toc-toggle');
    let collapsed = false;
    toggleBtn.addEventListener('click', () => {
      collapsed = !collapsed;
      toc.classList.toggle('is-collapsed', collapsed);
      toggleBtn.textContent = collapsed ? '+' : '−';
    });

    // Inject TOC vào ĐẦU article-body (sau tiêu đề + ảnh cover, trước nội dung)
    // Trước đây: document.body.appendChild(toc) → sticky bên phải
    // Bây giờ: insert vào đầu article-body như block inline
    articleBody.insertBefore(toc, articleBody.firstChild);

    // Highlight TOC item theo section đang xem
    const tocLinks = toc.querySelectorAll('.toc-list a');
    function updateActive() {
      let activeId = null;
      const offset = window.innerHeight / 3;
      headings.forEach((h) => {
        const rect = h.getBoundingClientRect();
        if (rect.top < offset) activeId = h.id;
      });
      tocLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + activeId);
      });
    }
    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
  }

  // ========================================================
  // 3. Image Lightbox
  // ========================================================
  function initLightbox() {
    const images = articleBody.querySelectorAll('img');
    if (images.length === 0) return;

    let overlay = null;

    function open(src, alt) {
      if (overlay) return;
      overlay = document.createElement('div');
      overlay.id = 'lightbox-overlay';
      overlay.innerHTML = `
        <button class="lightbox-close" aria-label="Đóng">×</button>
        <img src="${escapeAttr(src)}" alt="${escapeAttr(alt || '')}" class="lightbox-image">
        ${alt ? `<div class="lightbox-caption">${escapeHtml(alt)}</div>` : ''}
      `;
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.classList.contains('lightbox-close')) close();
      });
      document.addEventListener('keydown', onKey);
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      // Force reflow then add visible class for animation
      void overlay.offsetWidth;
      overlay.classList.add('is-visible');
    }
    function close() {
      if (!overlay) return;
      overlay.classList.remove('is-visible');
      setTimeout(() => {
        if (overlay) overlay.remove();
        overlay = null;
        document.body.style.overflow = '';
      }, 200);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
    }

    images.forEach((img) => {
      // Bỏ qua ảnh icon nhỏ
      if (img.width > 0 && img.width < 100) return;
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => open(img.src, img.alt));
      // Lazy load
      if (!img.loading) img.loading = 'lazy';
    });
  }

  // ========================================================
  // Utilities
  // ========================================================
  function slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
  }
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/`/g, '&#96;');
  }

  // ========================================================
  // Init khi DOM ready
  // ========================================================
  function init() {
    initReadingProgress();
    initTOC();
    initLightbox();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
