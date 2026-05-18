/* ============================================
   Tamayoko — Interaction layer
   - Hero carousel (auto-rotate, manual nav, dots)
   - Sticky header on scroll
   - Mobile menu toggle
   - Smooth scroll with header offset
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // BACKEND CONFIG — Google Apps Script webhook
  // ============================================
  // Sau khi deploy Apps Script làm Web App, paste URL vào đây (giữa 2 dấu ').
  // URL có dạng: https://script.google.com/macros/s/AKfycb..../exec
  // Trước khi paste URL, hệ thống vẫn lưu đơn vào localStorage để bạn không mất.
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyoSOiYIJQN04oKtkOugknP4eRDFigD04Qz6fHKJYWuLea_xF7gwW2CHSSem2ZvJBKt/exec';

  function sendToBackend(payload) {
    // Bỏ qua nếu chưa cấu hình URL
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.length < 20) {
      console.warn('[Tamayoko] Apps Script URL chưa cấu hình — đơn chỉ lưu localStorage.');
      return Promise.resolve({ ok: false, reason: 'not_configured' });
    }
    // Dùng no-cors + text/plain để tránh CORS preflight với Google Apps Script.
    // Apps Script vẫn nhận được body JSON qua e.postData.contents
    return fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    }).then(() => ({ ok: true }))
      .catch((err) => {
        console.error('[Tamayoko] Backend error:', err);
        return { ok: false, error: String(err) };
      });
  }

  // ============ STICKY HEADER ============
  const header = document.getElementById('siteHeader');

  function onScroll() {
    if (!header) return;
    if (window.scrollY > 20) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ============ MOBILE MENU ============
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.querySelector('.main-nav');

  function closeAllDropdowns() {
    document.querySelectorAll('.nav-dropdown.is-open, .nav-submenu.is-open')
      .forEach(el => el.classList.remove('is-open'));
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      menuToggle.classList.toggle('is-open', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (!isOpen) closeAllDropdowns();
    });

    // Tapping a leaf link closes the nav (mobile only)
    nav.querySelectorAll('.nav-leaf, .nav-link').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        menuToggle.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        closeAllDropdowns();
      });
    });
  }

  // ============ DROPDOWN TOGGLES (mobile click) ============
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

  document.querySelectorAll('.nav-dropdown-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (!isMobile()) return; // desktop uses CSS hover
      e.preventDefault();
      e.stopPropagation();
      const dropdown = btn.closest('.nav-dropdown');
      // Close other top-level dropdowns
      document.querySelectorAll('.nav-dropdown.is-open').forEach(d => {
        if (d !== dropdown) {
          d.classList.remove('is-open');
          // also close their submenus
          d.querySelectorAll('.nav-submenu.is-open').forEach(s => s.classList.remove('is-open'));
        }
      });
      dropdown.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', dropdown.classList.contains('is-open') ? 'true' : 'false');
    });
  });

  document.querySelectorAll('.nav-submenu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (!isMobile()) return;
      e.preventDefault();
      e.stopPropagation();
      const submenu = btn.closest('.nav-submenu');
      // Close sibling submenus
      const parentPanel = submenu.parentElement;
      parentPanel.querySelectorAll('.nav-submenu.is-open').forEach(s => {
        if (s !== submenu) s.classList.remove('is-open');
      });
      submenu.classList.toggle('is-open');
    });
  });

  // Reset dropdown state on resize (desktop → mobile transitions)
  let lastIsMobile = isMobile();
  window.addEventListener('resize', () => {
    const nowMobile = isMobile();
    if (lastIsMobile !== nowMobile) {
      closeAllDropdowns();
      lastIsMobile = nowMobile;
    }
  }, { passive: true });

  // ============ HERO CAROUSEL ============
  const carousel = document.getElementById('heroCarousel');

  if (carousel) {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots = carousel.querySelectorAll('.dot');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    let currentSlide = 0;
    let autoRotateTimer = null;
    const AUTO_ROTATE_DELAY = 6000; // 6 seconds

    function goToSlide(index) {
      // Wrap around
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;

      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index);
      });

      currentSlide = index;
    }

    function nextSlide() {
      goToSlide(currentSlide + 1);
    }

    function prevSlide() {
      goToSlide(currentSlide - 1);
    }

    function startAutoRotate() {
      stopAutoRotate();
      autoRotateTimer = setInterval(nextSlide, AUTO_ROTATE_DELAY);
    }

    function stopAutoRotate() {
      if (autoRotateTimer) {
        clearInterval(autoRotateTimer);
        autoRotateTimer = null;
      }
    }

    // Button bindings
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        startAutoRotate(); // restart timer after manual interaction
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        startAutoRotate();
      });
    }

    // Dot bindings
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        goToSlide(i);
        startAutoRotate();
      });
    });

    // Pause on hover
    carousel.addEventListener('mouseenter', stopAutoRotate);
    carousel.addEventListener('mouseleave', startAutoRotate);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Only when carousel is in viewport (rough check)
      const rect = carousel.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    });

    // Touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoRotate();
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const swipeDistance = touchStartX - touchEndX;
      const SWIPE_THRESHOLD = 50;

      if (swipeDistance > SWIPE_THRESHOLD) nextSlide();
      else if (swipeDistance < -SWIPE_THRESHOLD) prevSlide();

      startAutoRotate();
    }, { passive: true });

    // Start auto rotation
    startAutoRotate();
  }

  // ============ SCROLL REVEAL ============
  const revealTargets = document.querySelectorAll(
    '.section-header, .product-card, .feature-card, .why-card, .showcase-content, .showcase-visual, .contact-channel, .related-card, .specs-row'
  );

  revealTargets.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          // Stagger cards a bit
          const delay = (target.classList.contains('product-card') ||
                         target.classList.contains('why-card') ||
                         target.classList.contains('feature-card') ||
                         target.classList.contains('related-card'))
            ? Array.from(target.parentElement.children).indexOf(target) * 80
            : 0;
          setTimeout(() => target.classList.add('is-visible'), delay);
          observer.unobserve(target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px',
    });

    revealTargets.forEach(el => observer.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  // ============ SMOOTH SCROLL FOR ANCHOR LINKS ============
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href.length < 2) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const headerHeight = header ? header.offsetHeight : 0;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    });
  });

  // ============ CART SYSTEM (localStorage) ============
  function formatPrice(amount) {
    return Number(amount || 0).toLocaleString('vi-VN') + 'đ';
  }

  const Cart = {
    KEY: 'Tamayoko_cart_v1',
    ORDERS_KEY: 'Tamayoko_orders_v1',

    getItems() {
      try {
        return JSON.parse(localStorage.getItem(this.KEY) || '[]');
      } catch (e) {
        return [];
      }
    },

    setItems(items) {
      localStorage.setItem(this.KEY, JSON.stringify(items));
      this.refresh();
    },

    add(product) {
      const items = this.getItems();
      const existing = items.find(i => i.id === product.id);
      if (existing) {
        existing.qty = (existing.qty || 1) + (product.qty || 1);
      } else {
        items.push({
          id: product.id,
          name: product.name,
          price: parseInt(product.price, 10),
          image: product.image,
          qty: product.qty || 1,
        });
      }
      this.setItems(items);
    },

    remove(id) {
      this.setItems(this.getItems().filter(i => i.id !== id));
    },

    setQty(id, qty) {
      const items = this.getItems();
      const item = items.find(i => i.id === id);
      if (!item) return;
      item.qty = Math.max(1, parseInt(qty, 10) || 1);
      this.setItems(items);
    },

    clear() {
      this.setItems([]);
    },

    count() {
      return this.getItems().reduce((sum, i) => sum + (i.qty || 0), 0);
    },

    total() {
      return this.getItems().reduce((sum, i) => sum + (i.price || 0) * (i.qty || 0), 0);
    },

    saveOrder(order) {
      try {
        const orders = JSON.parse(localStorage.getItem(this.ORDERS_KEY) || '[]');
        orders.unshift(order);
        // keep last 50
        localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders.slice(0, 50)));
      } catch (e) {}
    },

    refresh() {
      this.updateBadge();
      this.renderDrawer();
    },

    updateBadge() {
      const badges = document.querySelectorAll('.cart-badge');
      const count = this.count();
      badges.forEach(badge => {
        badge.textContent = count;
        badge.classList.toggle('is-visible', count > 0);
      });
    },

    renderDrawer() {
      const list = document.getElementById('cartDrawerList');
      if (!list) return;
      const empty = document.getElementById('cartDrawerEmpty');
      const footer = document.getElementById('cartDrawerFooter');
      const totalEl = document.getElementById('cartDrawerTotal');

      const items = this.getItems();

      if (items.length === 0) {
        list.innerHTML = '';
        if (empty) empty.style.display = 'flex';
        if (footer) footer.style.display = 'none';
        return;
      }

      if (empty) empty.style.display = 'none';
      if (footer) footer.style.display = 'block';

      list.innerHTML = items.map(item => `
        <div class="cart-item" data-id="${item.id}">
          <div class="cart-item-image"><img src="${item.image}" alt="${item.name}"></div>
          <div class="cart-item-body">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">${formatPrice(item.price)}</div>
            <div class="cart-item-row">
              <div class="qty-control">
                <button class="qty-btn js-qty-down" data-id="${item.id}" aria-label="Giảm">−</button>
                <span class="qty-value">${item.qty}</span>
                <button class="qty-btn js-qty-up" data-id="${item.id}" aria-label="Tăng">+</button>
              </div>
              <button class="cart-item-remove js-cart-remove" data-id="${item.id}" aria-label="Xoá khỏi giỏ">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <div class="cart-item-subtotal">${formatPrice(item.price * item.qty)}</div>
          </div>
        </div>
      `).join('');

      if (totalEl) totalEl.textContent = formatPrice(this.total());

      // Rebind events for newly rendered items
      list.querySelectorAll('.js-qty-down').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const item = Cart.getItems().find(i => i.id === id);
          if (item && item.qty > 1) Cart.setQty(id, item.qty - 1);
        });
      });
      list.querySelectorAll('.js-qty-up').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const item = Cart.getItems().find(i => i.id === id);
          if (item) Cart.setQty(id, item.qty + 1);
        });
      });
      list.querySelectorAll('.js-cart-remove').forEach(btn => {
        btn.addEventListener('click', () => Cart.remove(btn.dataset.id));
      });
    },
  };

  // Expose globally for inline handlers / debugging
  window.TamayokoCart = Cart;
  window.TamayokoSendToBackend = sendToBackend; // for lien-he.html

  // ============ TOAST NOTIFICATIONS ============
  function showToast(message, type = 'success') {
    const existing = document.querySelector('.yk-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `yk-toast yk-toast--${type}`;
    toast.innerHTML = `
      <div class="yk-toast-icon" aria-hidden="true">${type === 'success' ? '✓' : 'ⓘ'}</div>
      <div class="yk-toast-message">${message}</div>
    `;
    document.body.appendChild(toast);

    // trigger transition
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
  window.TamayokoToast = showToast;

  // ============ CART DRAWER TOGGLE ============
  function pathPrefix() {
    return window.location.pathname.includes('/products/') ? '../' : '';
  }

  function openCartDrawer() {
    document.body.classList.add('cart-drawer-open');
    document.querySelector('.cart-drawer')?.classList.add('is-open');
    document.querySelector('.cart-drawer-overlay')?.classList.add('is-open');
    Cart.renderDrawer();
  }

  function closeCartDrawer() {
    document.body.classList.remove('cart-drawer-open');
    document.querySelector('.cart-drawer')?.classList.remove('is-open');
    document.querySelector('.cart-drawer-overlay')?.classList.remove('is-open');
  }

  document.querySelectorAll('.cart-icon-btn').forEach(btn => {
    btn.addEventListener('click', openCartDrawer);
  });
  document.querySelectorAll('.cart-drawer-close, .cart-drawer-overlay').forEach(el => {
    el.addEventListener('click', closeCartDrawer);
  });

  // Esc closes drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCartDrawer();
  });

  // ============ PRODUCT PAGE BUTTONS (add-to-cart + buy-now) ============
  function readProductFromButton(btn) {
    return {
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: parseInt(btn.dataset.price, 10) || 0,
      image: btn.dataset.image,
    };
  }

  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = readProductFromButton(btn);
      if (!product.id) return;
      Cart.add(product);
      showToast(`Đã thêm ${product.name} vào giỏ`);
    });
  });

  document.querySelectorAll('.buy-now-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = readProductFromButton(btn);
      if (!product.id) return;
      product.qty = 1;
      sessionStorage.setItem('Tamayoko_buy_now', JSON.stringify(product));
      window.location.href = pathPrefix() + 'checkout.html';
    });
  });

  document.getElementById('cartDrawerCheckout')?.addEventListener('click', () => {
    if (Cart.count() === 0) {
      showToast('Giỏ hàng đang trống', 'info');
      return;
    }
    sessionStorage.removeItem('Tamayoko_buy_now');
    window.location.href = pathPrefix() + 'checkout.html';
  });

  // Initial badge sync on every page
  Cart.updateBadge();

  // ============ CHECKOUT PAGE ============
  function initCheckout() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;

    const summaryList = document.getElementById('checkoutSummaryList');
    const summaryTotal = document.getElementById('checkoutTotal');
    const summarySubtotal = document.getElementById('checkoutSubtotal');
    const successModal = document.getElementById('orderSuccessModal');
    const successOrderId = document.getElementById('successOrderId');
    const successSummary = document.getElementById('successSummary');
    const checkoutEmpty = document.getElementById('checkoutEmpty');
    const checkoutMain = document.getElementById('checkoutMain');

    // Pick items: buy-now mode if sessionStorage has it, else cart
    let items;
    let isBuyNow = false;
    const buyNowRaw = sessionStorage.getItem('Tamayoko_buy_now');
    if (buyNowRaw) {
      try {
        const buyNow = JSON.parse(buyNowRaw);
        items = [buyNow];
        isBuyNow = true;
      } catch (e) {
        items = Cart.getItems();
      }
    } else {
      items = Cart.getItems();
    }

    // Empty state
    if (!items || items.length === 0) {
      if (checkoutEmpty) checkoutEmpty.style.display = 'block';
      if (checkoutMain) checkoutMain.style.display = 'none';
      return;
    }

    // ----- Render & state management for summary -----
    function persistItems() {
      // Persist mutation back to source of truth
      if (isBuyNow) {
        if (items.length === 0) {
          sessionStorage.removeItem('Tamayoko_buy_now');
        } else {
          // Buy-now is single item — keep only first
          sessionStorage.setItem('Tamayoko_buy_now', JSON.stringify(items[0]));
        }
      } else {
        Cart.setItems(items);
        Cart.refresh();
      }
    }

    function renderSummary() {
      // If we emptied everything, show empty state and stop
      if (!items || items.length === 0) {
        if (checkoutEmpty) checkoutEmpty.style.display = 'block';
        if (checkoutMain) checkoutMain.style.display = 'none';
        return;
      }

      if (summaryList) {
        summaryList.innerHTML = items.map(item => `
          <div class="summary-item" data-id="${item.id}">
            <div class="summary-item-image">
              <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="summary-item-body">
              <div class="summary-item-row-top">
                <div class="summary-item-name">${item.name}</div>
                <button class="summary-item-remove js-summary-remove" data-id="${item.id}" type="button" aria-label="Xoá khỏi đơn hàng">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
              <div class="summary-item-unit-price">${formatPrice(item.price)} / cái</div>
              <div class="summary-item-row-bottom">
                <div class="summary-qty-control">
                  <button class="summary-qty-btn js-summary-qty-down" data-id="${item.id}" type="button" aria-label="Giảm số lượng">−</button>
                  <span class="summary-qty-value">${item.qty}</span>
                  <button class="summary-qty-btn js-summary-qty-up" data-id="${item.id}" type="button" aria-label="Tăng số lượng">+</button>
                </div>
                <div class="summary-item-subtotal">${formatPrice(item.price * item.qty)}</div>
              </div>
            </div>
          </div>
        `).join('');
      }

      const total = items.reduce((s, i) => s + i.price * i.qty, 0);
      if (summarySubtotal) summarySubtotal.textContent = formatPrice(total);
      if (summaryTotal) summaryTotal.textContent = formatPrice(total);
    }

    // Delegate qty/remove clicks on summary list
    if (summaryList) {
      summaryList.addEventListener('click', (e) => {
        const up = e.target.closest('.js-summary-qty-up');
        const down = e.target.closest('.js-summary-qty-down');
        const rm = e.target.closest('.js-summary-remove');
        const id = (up || down || rm)?.dataset.id;
        if (!id) return;

        const idx = items.findIndex(it => String(it.id) === String(id));
        if (idx === -1) return;

        if (up) {
          items[idx].qty = (items[idx].qty || 1) + 1;
        } else if (down) {
          if (items[idx].qty > 1) {
            items[idx].qty -= 1;
          } else {
            // Drop the item if going below 1
            items.splice(idx, 1);
          }
        } else if (rm) {
          items.splice(idx, 1);
        }

        persistItems();
        renderSummary();
      });
    }

    renderSummary();

    // Form submit handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Guard: empty cart at submit time
      if (!items || items.length === 0) {
        showToast('Đơn hàng đang trống', 'info');
        return;
      }

      // Basic validation
      const data = new FormData(form);
      const required = ['fullname', 'phone', 'address', 'city'];
      let isValid = true;
      required.forEach(field => {
        const input = form.elements[field];
        const value = (data.get(field) || '').trim();
        if (!value) {
          input?.classList.add('is-invalid');
          isValid = false;
        } else {
          input?.classList.remove('is-invalid');
        }
      });

      // Phone format (10-11 digits VN)
      const phone = (data.get('phone') || '').trim();
      if (phone && !/^0\d{9,10}$/.test(phone)) {
        form.elements.phone?.classList.add('is-invalid');
        isValid = false;
        showToast('Số điện thoại không đúng định dạng', 'info');
        return;
      }

      if (!isValid) {
        showToast('Vui lòng điền đầy đủ thông tin', 'info');
        return;
      }

      // Generate order
      const now = new Date();
      const orderId = 'YK-' +
        now.getFullYear().toString().slice(2) +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '-' +
        Math.floor(1000 + Math.random() * 9000);

      // Recompute total at submit (items may have been edited)
      const total = items.reduce((s, i) => s + i.price * i.qty, 0);

      const order = {
        _type: 'order',
        id: orderId,
        createdAt: now.toISOString(),
        customer: {
          fullname: data.get('fullname'),
          phone: data.get('phone'),
          email: data.get('email') || '',
          city: data.get('city'),
          address: data.get('address'),
          note: data.get('note') || '',
        },
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        total: total,
        paymentMethod: 'COD',
      };

      // Save locally so Jay can debug via console: TamayokoCart.getOrders()
      Cart.saveOrder(order);

      // Disable submit button to prevent double-submit
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.pointerEvents = 'none';
      }

      // Gửi đơn đến Google Sheets qua Apps Script webhook
      sendToBackend(order).then((result) => {
        console.log('[Tamayoko order]', order, 'backend:', result);

        // Clear buy-now / cart
        if (isBuyNow) {
          sessionStorage.removeItem('Tamayoko_buy_now');
        } else {
          Cart.clear();
        }

        // Show success modal
        if (successOrderId) successOrderId.textContent = orderId;
        if (successSummary) {
          successSummary.innerHTML = `
            <div class="success-row"><span>Sản phẩm</span><span>${items.map(i => `${i.name} ×${i.qty}`).join(', ')}</span></div>
            <div class="success-row"><span>Tổng tiền</span><span><strong>${formatPrice(total)}</strong></span></div>
            <div class="success-row"><span>Người nhận</span><span>${data.get('fullname')}</span></div>
            <div class="success-row"><span>Số điện thoại</span><span>${data.get('phone')}</span></div>
            <div class="success-row"><span>Địa chỉ</span><span>${data.get('address')}, ${data.get('city')}</span></div>
            <div class="success-row"><span>Phương thức</span><span>Thanh toán khi nhận hàng (COD)</span></div>
          `;
        }
        if (successModal) {
          successModal.classList.add('is-visible');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    // Close success modal
    document.querySelectorAll('.success-modal-close, [data-close-success]').forEach(btn => {
      btn.addEventListener('click', () => {
        successModal?.classList.remove('is-visible');
        document.body.style.overflow = '';
      });
    });

    // Remove invalid state when user starts typing
    form.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('input', () => input.classList.remove('is-invalid'));
    });
  }
  initCheckout();

  // ============ FLOATING CONTACT WIDGET ============
  // Inject the contact widget on every page automatically.
  // Update the 3 links below with Tamayoko's real channels.
  const CONTACT_CONFIG = {
    messenger: 'https://m.me/tamayokoofficial',  // Tamayoko Facebook Page
    zalo: 'https://zalo.me/0971222822',          // Tamayoko Zalo
    phone: '0971222822',                          // Hotline thật (dùng cho tel:)
    phoneDisplay: '0971 222 822',                 // Hotline hiển thị tooltip
  };

  function injectContactWidget() {
    if (document.querySelector('.contact-widget')) return;

    const widget = document.createElement('div');
    widget.className = 'contact-widget';
    widget.setAttribute('aria-label', 'Liên hệ Tamayoko');
    widget.innerHTML = `
      <a href="${CONTACT_CONFIG.messenger}" target="_blank" rel="noopener noreferrer"
        class="contact-widget-btn contact-widget-btn--messenger"
        aria-label="Nhắn tin Messenger">
        <span class="contact-widget-label">Nhắn tin Messenger</span>
        <svg class="contact-widget-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.451 5.512 3.726 7.21V22l3.405-1.869c.91.252 1.875.388 2.869.388 5.523 0 10-4.144 10-9.259C22 6.145 17.523 2 12 2zm.994 12.467l-2.546-2.715-4.971 2.715 5.466-5.806 2.609 2.715 4.908-2.715-5.466 5.806z"/>
        </svg>
      </a>

      <a href="${CONTACT_CONFIG.zalo}" target="_blank" rel="noopener noreferrer"
        class="contact-widget-btn contact-widget-btn--zalo"
        aria-label="Chat qua Zalo">
        <span class="contact-widget-label">Chat Zalo</span>
        <svg class="contact-widget-zalo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M28 4 H72 Q94 4 94 26 V58 Q94 80 72 80 H56 L40 94 Q28 98 30 86 V78 Q6 74 6 52 V26 Q6 4 28 4 Z" fill="#0068FF"/>
          <path d="M32 12 H68 Q86 12 86 28 V56 Q86 72 68 72 H54 L42 82 Q36 84 38 77 V72 Q14 68 14 50 V28 Q14 12 32 12 Z" fill="#FFFFFF"/>
          <text x="50" y="48" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif" font-weight="800" font-size="22" fill="#0068FF" letter-spacing="-0.5">Zalo</text>
        </svg>
      </a>

      <a href="tel:${CONTACT_CONFIG.phone}"
        class="contact-widget-btn contact-widget-btn--phone"
        aria-label="Gọi hotline ${CONTACT_CONFIG.phoneDisplay}">
        <span class="contact-widget-label">Gọi hotline · ${CONTACT_CONFIG.phoneDisplay}</span>
        <svg class="contact-widget-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        </svg>
      </a>
    `;
    document.body.appendChild(widget);
  }
  injectContactWidget();

  // ============ TIKTOK REVIEWS MODAL ============
  (function initTikTokReviews() {
    const cards = document.querySelectorAll('.review-card');
    const modal = document.getElementById('ttModal');
    if (!cards.length || !modal) return;

    const embedContainer = document.getElementById('ttModalEmbed');
    let lastFocused = null;

    function loadTikTokScript() {
      // TikTok's embed.js scans for .tiktok-embed only once on load.
      // To re-trigger parsing on each modal open, we always re-inject
      // the script (the previously-rendered iframes are not affected).
      return new Promise((resolve) => {
        // Remove previous script tag if any
        const old = document.getElementById('tt-embed-script');
        if (old) old.remove();

        const s = document.createElement('script');
        s.id = 'tt-embed-script';
        s.src = 'https://www.tiktok.com/embed.js';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => resolve(); // resolve anyway so modal still shows fallback
        document.body.appendChild(s);
      });
    }

    function buildEmbed(videoId, username) {
      // TikTok official embed markup
      return (
        '<blockquote class="tiktok-embed" ' +
        'cite="https://www.tiktok.com/@' + username + '/video/' + videoId + '" ' +
        'data-video-id="' + videoId + '" ' +
        'style="max-width: 605px; min-width: 325px;">' +
        '<section></section>' +
        '</blockquote>'
      );
    }

    function openModal(videoId, username) {
      lastFocused = document.activeElement;
      embedContainer.innerHTML = buildEmbed(videoId, username);
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      loadTikTokScript();

      // Focus close button for accessibility
      const closeBtn = modal.querySelector('.tt-modal-close');
      if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      embedContainer.innerHTML = '';
      document.body.style.overflow = '';
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-tt-id');
        const user = card.getAttribute('data-tt-user');
        if (id && user) openModal(id, user);
      });
    });

    modal.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close')) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  })();

  // ============ FAQ SIDEBAR SCROLL-SPY ============
  (function initFaqScrollSpy() {
    const nav = document.getElementById('supportNav');
    if (!nav) return;
    const links = Array.from(nav.querySelectorAll('.support-nav-link'));
    if (links.length === 0) return;

    const sections = links
      .map(l => document.getElementById(l.getAttribute('href').replace('#', '')))
      .filter(Boolean);
    if (sections.length === 0) return;

    function setActive(idx) {
      links.forEach((l, i) => l.classList.toggle('is-active', i === idx));
    }

    // Use IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      // Find the topmost visible section
      const visible = entries
        .filter(e => e.isIntersecting)
        .map(e => sections.indexOf(e.target))
        .filter(i => i >= 0);
      if (visible.length > 0) {
        setActive(Math.min(...visible));
      }
    }, {
      rootMargin: '-100px 0px -60% 0px',
    });

    sections.forEach(s => observer.observe(s));

    // Smooth scroll on click
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href').replace('#', '');
        const target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          window.scrollTo({
            top: target.offsetTop - 80,
            behavior: 'smooth',
          });
        }
      });
    });
  })();

  // ============ CONSOLE EASTER EGG ============
  if (typeof console !== 'undefined' && console.log) {
    console.log('%c Tamayoko ', 'background:#DC143B;color:#fff;font-weight:bold;font-size:14px;padding:4px 8px;');
    console.log('%c Công nghệ vì cuộc sống tốt đẹp hơn ', 'color:#888;font-style:italic;');
    console.log('Build: v2.1 — Google Sheets backend integration');
  }
})();
