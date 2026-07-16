// ============================================================
// /functions/news.ts
// Trang danh sách tin tức - SSR
// Layout featured + grid + filter category
// ============================================================

import {
  type Env, type Post,
  fetchPostsList, apiBase, renderHead, renderHeader, renderFooter,
  escapeHtml, formatDateVN, isoDate,
} from './_lib/cloudcms';

type Category = {
  id: string;
  slug: string;
  name: string;
  post_count: number;
};

async function fetchCategories(env: Env): Promise<Category[]> {
  try {
    const r = await fetch(`${apiBase(env)}/api/public/categories`, {
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!r.ok) return [];
    const data = await r.json() as { items: Category[] };
    return data.items || [];
  } catch {
    return [];
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const baseUrl = url.origin;
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const category = url.searchParams.get('category') ?? undefined;

  try {
    const [data, categories] = await Promise.all([
      fetchPostsList(context.env, { page, limit: 13, category }),
      fetchCategories(context.env),
    ]);

    const categoryObj = category ? categories.find((c) => c.slug === category) : null;

    return new Response(
      renderNewsListPage(data.items, page, category, categoryObj, categories, baseUrl),
      {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, max-age=60, s-maxage=300',
        },
      }
    );
  } catch (err: any) {
    console.error('Error rendering news list:', err);
    return new Response(`Server error: ${err.message}`, { status: 500 });
  }
};

function renderNewsListPage(
  posts: Post[],
  page: number,
  categorySlug: string | undefined,
  categoryObj: Category | null | undefined,
  allCategories: Category[],
  baseUrl: string
): string {
  const title = categoryObj
    ? `${categoryObj.name} · Tin tức · Yokool`
    : 'Tin tức · Yokool';
  const description =
    'Tin tức công nghệ mới nhất từ Yokool: hướng dẫn sử dụng sạc dự phòng, củ sạc nhanh GaN, ổ điện du lịch, và những đánh giá sản phẩm chân thực.';
  const canonical = `${baseUrl}/news${
    categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : ''
  }${page > 1 ? `${categorySlug ? '&' : '?'}page=${page}` : ''}`;

  // Tách featured post (chỉ ở page 1, không filter)
  const isHomePage = page === 1 && !categorySlug;
  const featuredPost = isHomePage && posts.length > 0 ? posts[0] : null;
  const gridPosts = featuredPost ? posts.slice(1) : posts;

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    numberOfItems: posts.length,
    itemListElement: posts.map((post, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${baseUrl}/news/${post.slug}`,
      name: post.title,
    })),
  };

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-17796115003"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-17796115003');
  gtag('config', 'G-YPXHZWFBGY');
</script>
${renderHead({
  title,
  description,
  canonical,
  ogTitle: title,
  ogDescription: description,
  ogImage: `${baseUrl}/images/og-default.jpg`,
  ogType: 'website',
  jsonLd: itemListSchema,
})}
</head>
<body>
${renderHeader()}

<main class="news-page-v2">
  <section class="news-hero-v2">
    <div class="container">
      <span class="news-eyebrow">/ Yokool blog</span>
      <h1 class="news-h1">
        ${categoryObj
          ? `${escapeHtml(categoryObj.name)}<em>.</em>`
          : `Hướng dẫn · Đánh giá <em>· Câu chuyện.</em>`
        }
      </h1>
      <p class="news-h1-sub">
        ${categoryObj
          ? `${categoryObj.post_count} bài viết trong danh mục này.`
          : 'Cập nhật tin tức công nghệ, mẹo sử dụng và đánh giá sản phẩm từ đội ngũ Yokool.'
        }
      </p>
    </div>
  </section>

  ${featuredPost ? renderFeaturedPost(featuredPost) : ''}

  <section class="news-list-v2">
    <div class="container">
      <div class="news-filter-bar">
        <div class="news-filter-label">
          ${categoryObj
            ? `Đang lọc theo: <strong>${escapeHtml(categoryObj.name)}</strong>`
            : `Tất cả bài viết`
          }
        </div>
        <details class="news-filter-dropdown">
          <summary class="news-filter-trigger">
            <span>${categoryObj ? escapeHtml(categoryObj.name) : 'Tất cả danh mục'}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </summary>
          <div class="news-filter-menu">
            <a href="/news" class="news-filter-item ${!categorySlug ? 'is-active' : ''}">
              Tất cả danh mục
            </a>
            ${allCategories.map((c) => `
              <a href="/news?category=${encodeURIComponent(c.slug)}"
                 class="news-filter-item ${c.slug === categorySlug ? 'is-active' : ''}">
                ${escapeHtml(c.name)}
                <span class="news-filter-count">${c.post_count}</span>
              </a>
            `).join('')}
          </div>
        </details>
      </div>

      ${gridPosts.length === 0
        ? `<div class="news-empty-v2">
            <p>Chưa có bài viết nào${categoryObj ? ` trong danh mục "${escapeHtml(categoryObj.name)}"` : ''}.</p>
            <a href="/news" class="news-empty-link">Xem tất cả tin tức →</a>
          </div>`
        : `<div class="news-grid-v2">
            ${gridPosts.map((post) => renderPostCard(post)).join('\n')}
          </div>
          ${renderPagination(page, gridPosts.length, categorySlug)}`
      }
    </div>
  </section>
</main>

${renderFooter()}
</body>
</html>`;
}

function renderFeaturedPost(post: Post): string {
  const url = `/news/${post.slug}`;
  const image = post.og_image_url || '/images/og-default.jpg';
  const date = formatDateVN(post.published_at);
  const dateIso = isoDate(post.published_at);
  const category = post.category_name;

  return `
<section class="news-featured-v2">
  <div class="container">
    <a href="${url}" class="news-featured-card">
      <div class="news-featured-media">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(post.title)}" loading="eager">
      </div>
      <div class="news-featured-body">
        <div class="news-featured-meta">
          ${category ? `<span class="news-tag">${escapeHtml(category)}</span>` : ''}
          <span class="news-featured-date">Bài nổi bật</span>
        </div>
        <h2 class="news-featured-title">${escapeHtml(post.title)}</h2>
        ${post.excerpt ? `<p class="news-featured-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
        <div class="news-featured-footer">
          <time datetime="${dateIso}">${date}</time>
          <span class="news-featured-dot">·</span>
          <span>${post.reading_time || 1} phút đọc</span>
        </div>
      </div>
    </a>
  </div>
</section>
  `.trim();
}

function renderPostCard(post: Post): string {
  const url = `/news/${post.slug}`;
  const image = post.og_image_url || '/images/og-default.jpg';
  const date = formatDateVN(post.published_at);
  const dateIso = isoDate(post.published_at);
  const category = post.category_name;

  return `
<article class="news-card-v2">
  <a href="${url}" class="news-card-v2-link">
    <div class="news-card-v2-media">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(post.title)}" loading="lazy">
    </div>
    <div class="news-card-v2-body">
      <div class="news-card-v2-meta">
        <time datetime="${dateIso}">${date}</time>
      </div>
      <h3 class="news-card-v2-title">${escapeHtml(post.title)}</h3>
      ${post.excerpt ? `<p class="news-card-v2-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
      ${category
        ? `<div class="news-card-v2-tags"><span class="news-tag">${escapeHtml(category)}</span></div>`
        : ''
      }
    </div>
  </a>
</article>
  `.trim();
}

function renderPagination(currentPage: number, itemsCount: number, category: string | undefined): string {
  const hasNext = itemsCount >= 12;
  const hasPrev = currentPage > 1;
  if (!hasNext && !hasPrev) return '';

  const catParam = category ? `&category=${encodeURIComponent(category)}` : '';

  return `
<nav class="news-pagination" aria-label="Phân trang">
  ${hasPrev
    ? `<a href="/news?page=${currentPage - 1}${catParam}" class="news-page-btn">← Trang trước</a>`
    : `<span class="news-page-btn news-page-btn--disabled">← Trang trước</span>`
  }
  <span class="news-page-current">Trang ${currentPage}</span>
  ${hasNext
    ? `<a href="/news?page=${currentPage + 1}${catParam}" class="news-page-btn">Trang sau →</a>`
    : `<span class="news-page-btn news-page-btn--disabled">Trang sau →</span>`
  }
</nav>
  `.trim();
}
