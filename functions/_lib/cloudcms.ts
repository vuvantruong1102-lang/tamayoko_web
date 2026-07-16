// ============================================================
// CloudCMS integration helpers cho yokool.vn
// Dùng chung cho tất cả Pages Functions
// ============================================================

export type Env = {
  CLOUDCMS_API: string;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_html: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  focus_keyword: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  og_type: string;
  twitter_card: string;
  schema_type: string;
  schema_json: string | null;
  featured_image_alt: string | null;
  robots_index: number;
  robots_follow: number;
  view_count: number;
  reading_time: number | null;
  word_count: number | null;
  published_at: number | null;
  updated_at: number;
  author_name?: string;
  author_avatar?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  tags?: Array<{ id: string; name: string; slug: string }>;
};

const DEFAULT_API = 'https://cloudcms-api.vuvantruong-1102.workers.dev';

export function apiBase(env: Env): string {
  return (env.CLOUDCMS_API ?? DEFAULT_API).replace(/\/+$/, '');
}

export async function fetchPostsList(
  env: Env,
  opts: { page?: number; limit?: number; category?: string } = {}
): Promise<{ items: Post[]; page: number; limit: number }> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.category) params.set('category', opts.category);

  const url = `${apiBase(env)}/api/public/posts?${params}`;
  const resp = await fetch(url, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!resp.ok) throw new Error(`Posts API error: ${resp.status}`);
  return resp.json();
}

export async function fetchPostBySlug(env: Env, slug: string): Promise<Post | null> {
  const url = `${apiBase(env)}/api/public/posts/${encodeURIComponent(slug)}`;
  const resp = await fetch(url, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`Post API error: ${resp.status}`);
  return resp.json();
}

// Fetch related posts - cùng category, exclude current post, take 3
export async function fetchRelatedPosts(
  env: Env,
  currentPostId: string,
  categorySlug: string | null | undefined,
  limit: number = 3
): Promise<Post[]> {
  try {
    const params = new URLSearchParams();
    params.set('limit', String(limit + 1));
    if (categorySlug) params.set('category', categorySlug);

    const url = `${apiBase(env)}/api/public/posts?${params}`;
    const resp = await fetch(url, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (!resp.ok) return [];
    const data = await resp.json() as { items: Post[] };
    return data.items
      .filter((p) => p.id !== currentPostId)
      .slice(0, limit);
  } catch (err) {
    console.error('fetchRelatedPosts error:', err);
    return [];
  }
}

export function escapeHtml(s: string | null | undefined): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}

export function formatDateVN(timestamp: number | null): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day} tháng ${month}, ${year}`;
}

export function isoDate(timestamp: number | null): string {
  return timestamp ? new Date(timestamp).toISOString() : '';
}

// ============================================================
// HEAD - các meta tags chung cho tất cả trang
// ============================================================

export function renderHead(opts: {
  title: string;
  description: string;
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  robots?: string;
  jsonLd?: any;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string;
}): string {
  const ogTitle = opts.ogTitle ?? opts.title;
  const ogDescription = opts.ogDescription ?? opts.description;
  const ogType = opts.ogType ?? 'website';
  const robots = opts.robots ?? 'index, follow';

  return `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(opts.description)}">
  ${opts.keywords ? `<meta name="keywords" content="${escapeHtml(opts.keywords)}">` : ''}
  <meta name="robots" content="${escapeHtml(robots)}">

  <meta property="og:type" content="${escapeHtml(ogType)}">
  <meta property="og:url" content="${escapeHtml(opts.canonical)}">
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  ${opts.ogImage ? `<meta property="og:image" content="${escapeHtml(opts.ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">` : ''}
  <meta property="og:site_name" content="Yokool">
  <meta property="og:locale" content="vi_VN">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(opts.canonical)}">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  ${opts.ogImage ? `<meta name="twitter:image" content="${escapeHtml(opts.ogImage)}">` : ''}

  ${opts.publishedTime ? `<meta property="article:published_time" content="${escapeHtml(opts.publishedTime)}">` : ''}
  ${opts.modifiedTime ? `<meta property="article:modified_time" content="${escapeHtml(opts.modifiedTime)}">` : ''}
  ${opts.author ? `<meta property="article:author" content="${escapeHtml(opts.author)}">` : ''}

  <link rel="canonical" href="${escapeHtml(opts.canonical)}">
  <meta name="theme-color" content="#FFFFFF">
  <title>${escapeHtml(opts.title)}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/blog-enhance.css">
  <link rel="stylesheet" href="/news-v2.css">
  ${opts.jsonLd ? `<script type="application/ld+json">${JSON.stringify(opts.jsonLd)}</script>` : ''}
  `.trim();
}

// ============================================================
// HEADER - copy y nguyên từ index.html
// ============================================================

export function renderHeader(): string {
  return `
  <!-- ============ HEADER ============ -->
  <header class="site-header" id="siteHeader">
    <div class="container header-inner">
      <a href="/index.html" class="logo" aria-label="Yokool trang chủ">
        <img src="/images/yokool-logo.png" alt="Yokool" class="logo-img logo-img--dark"><img src="/images/yokool-logo-white.png" alt="Yokool" class="logo-img logo-img--light">
      </a>

      <nav class="main-nav" aria-label="Điều hướng chính">
        <a href="/index.html" class="nav-link">Trang chủ</a>

        <div class="nav-dropdown">
          <button class="nav-dropdown-btn" aria-haspopup="true" aria-expanded="false">
            Sạc dự phòng
            <svg class="nav-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
              <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="nav-dropdown-panel" role="menu">
            <a href="/products/jp395.html" class="nav-leaf">JP395</a>
          </div>
        </div>

        <div class="nav-dropdown">
          <button class="nav-dropdown-btn" aria-haspopup="true" aria-expanded="false">
            Củ sạc
            <svg class="nav-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
              <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="nav-dropdown-panel" role="menu">
            <a href="/products/rc502.html" class="nav-leaf">RC502</a>
          </div>
        </div>

        <div class="nav-dropdown">
          <button class="nav-dropdown-btn" aria-haspopup="true" aria-expanded="false">
            Ổ điện du lịch
            <svg class="nav-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
              <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="nav-dropdown-panel" role="menu">
            <a href="/products/sl207.html" class="nav-leaf">SL207</a>
            <a href="/products/ol212.html" class="nav-leaf">OL212</a>
          </div>
        </div>

        <a href="/news" class="nav-link">Tin tức</a>
        <a href="/b2b.html" class="nav-link">Hợp tác B2B</a>
        <a href="/lien-he.html" class="nav-link">Liên hệ</a>
      </nav>

      <button class="cart-icon-btn" id="cartIconBtn" aria-label="Mở giỏ hàng">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 4H5L6 16C6 16.5523 6.44772 17 7 17H17C17.5523 17 18 16.5523 18 16L19 7H7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="9" cy="20" r="1.3" fill="currentColor"/>
          <circle cx="16" cy="20" r="1.3" fill="currentColor"/>
        </svg>
        <span class="cart-badge" aria-label="Số sản phẩm trong giỏ">0</span>
      </button>

      <a href="https://shopee.vn/tamayokoofficial" target="_blank" rel="noopener" class="cta-button cta-button--small">
        Mua tại Shopee
        <span class="cta-arrow">→</span>
      </a>

      <button class="menu-toggle" id="menuToggle" aria-label="Mở menu" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>
  `.trim();
}

// ============================================================
// FOOTER - copy y nguyên từ index.html
// ============================================================

export function renderFooter(): string {
  return `
  <!-- ============ FOOTER ============ -->
  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <a href="/index.html" class="logo">
          <img src="/images/yokool-logo-slogan.png" alt="Yokool" class="logo-img logo-img--dark"><img src="/images/yokool-logo-slogan-white.png" alt="Yokool" class="logo-img logo-img--light">
        </a>
        <p class="footer-tagline">Stay powered. Stay Cool</p>
        <div class="footer-company">
          <p class="footer-company-name">Công ty TNHH Thương mại dịch vụ và sản xuất VNF Việt Nam</p>
          <p class="footer-company-line">Mã số doanh nghiệp: 2400883385. Giấy chứng nhận đăng ký doanh nghiệp do Sở Kế hoạch và Đầu tư tỉnh Bắc Giang cấp lần đầu ngày 03/03/2020.</p>
          <p class="footer-company-line">Địa chỉ: KĐT Văn Khê, phường La Khê, quận Hà Đông, TP Hà Nội.</p>
        </div>
      </div>

      <div class="footer-cols">
        <div class="footer-col">
          <h4>Sản phẩm</h4>
          <a href="/products/sl207.html">SL207</a>
          <a href="/products/ol212.html">OL212</a>
          <a href="/products/jp395.html">JP395</a>
          <a href="/products/rc502.html">RC502</a>
        </div>
        <div class="footer-col">
          <h4>Hỗ trợ</h4>
          <a href="/lien-he.html">Liên hệ</a>
          <a href="/bao-hanh.html">Bảo hành</a>
          <a href="/van-chuyen.html">Vận chuyển</a>
          <a href="/faq.html">Câu hỏi thường gặp</a>
        </div>
        <div class="footer-col">
          <h4>Kênh bán</h4>
          <a href="https://shopee.vn/tamayokoofficial" target="_blank" rel="noopener">Shopee</a>
          <a href="https://zalo.me/0822838665" target="_blank" rel="noopener">Zalo</a>
          <a href="mailto:contact@yokool.vn">Email</a>
        </div>
        <div class="footer-col">
          <h4>Mạng xã hội</h4>
          <div class="footer-social">
            <a href="https://www.facebook.com/yokoolvietnam" target="_blank" rel="noopener" aria-label="Facebook Yokool" class="footer-social-link">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
              </svg>
            </a>
            <a href="https://www.youtube.com/@yokoolvn" target="_blank" rel="noopener" aria-label="YouTube Yokool" class="footer-social-link">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M23.5 6.2c-.3-1-1.1-1.8-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6c-1 .3-1.8 1.1-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1.1 1.8 2.1 2.1 1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/>
              </svg>
            </a>
            <a href="https://www.tiktok.com/@yokool.vit.nam" target="_blank" rel="noopener" aria-label="TikTok Yokool" class="footer-social-link">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V9.41a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.84z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="container footer-bottom">
      <p>© 2026 Yokool.</p>
    </div>
  </footer>

  <!-- ============ CART DRAWER ============ -->
  <div class="cart-drawer-overlay" aria-hidden="true"></div>
  <aside class="cart-drawer" aria-label="Giỏ hàng">
    <div class="cart-drawer-header">
      <h3 class="cart-drawer-title">Giỏ hàng</h3>
      <button class="cart-drawer-close" aria-label="Đóng giỏ hàng">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div class="cart-drawer-body">
      <div id="cartDrawerEmpty" class="cart-drawer-empty">
        <svg class="cart-drawer-empty-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M10 14H16L18 46C18 47.6569 19.3431 49 21 49H47C48.6569 49 50 47.6569 50 46L52 22H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="26" cy="56" r="3" stroke="currentColor" stroke-width="2"/>
          <circle cx="44" cy="56" r="3" stroke="currentColor" stroke-width="2"/>
        </svg>
        <div class="cart-drawer-empty-text">Giỏ hàng đang trống</div>
        <a href="/index.html" class="cta-button cta-button--ghost cta-button--small">Tiếp tục mua sắm</a>
      </div>
      <div id="cartDrawerList"></div>
    </div>

    <div class="cart-drawer-footer" id="cartDrawerFooter" style="display: none;">
      <div class="cart-drawer-total-row">
        <span class="cart-drawer-total-label">Tổng tạm tính</span>
        <span class="cart-drawer-total-value" id="cartDrawerTotal">0đ</span>
      </div>
      <button class="cta-button cta-button--full cta-button--large" id="cartDrawerCheckout">
        Thanh toán
        <span class="cta-arrow">→</span>
      </button>
      <div class="cart-drawer-hint">Phí vận chuyển sẽ tính ở bước kế tiếp · COD toàn quốc</div>
    </div>
  </aside>

  <script src="/script.js"></script>
  <script src="/blog-enhance.js" defer></script>
  `.trim();
}
