// ============================================================
// /functions/news/[slug].ts
// Trang chi tiết bài viết - SSR
// Bắt URL /news/<slug> và /news/<slug>.html (Pages tự fallback)
// ============================================================

import {
  type Env, type Post,
  fetchPostBySlug, fetchRelatedPosts, renderHead, renderHeader, renderFooter,
  escapeHtml, formatDateVN, isoDate,
} from '../_lib/cloudcms';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  let slug = context.params.slug as string;
  if (!slug) return new Response('Not found', { status: 404 });
  if (slug.endsWith('.html')) slug = slug.slice(0, -5);

  const baseUrl = new URL(context.request.url).origin;

  try {
    const post = await fetchPostBySlug(context.env, slug);
    if (!post) {
      // Quan trọng: trả 404 để Pages tự thử file static .html
      // Nhưng vì function này được gọi nghĩa là không có file static → trả 404 thật
      return new Response(notFoundHtml(), {
        status: 404,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }

    // Fetch related posts (cùng category, không phải bài hiện tại)
    const related = await fetchRelatedPosts(context.env, post.id, post.category_slug, 3);

    return new Response(renderPostPage(post, related, baseUrl), {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=60, s-maxage=300',
      },
    });
  } catch (err: any) {
    console.error('Error rendering post:', err);
    return new Response(`Server error: ${err.message}`, { status: 500 });
  }
};

function renderPostPage(post: Post, related: Post[], baseUrl: string): string {
  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || '';
  const canonical = post.canonical_url || `${baseUrl}/news/${post.slug}`;
  const robots = [
    post.robots_index ? 'index' : 'noindex',
    post.robots_follow ? 'follow' : 'nofollow',
  ].join(', ');

  // JSON-LD structured data
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': post.schema_type || 'Article',
    headline: post.title,
    description: description,
    datePublished: isoDate(post.published_at),
    dateModified: isoDate(post.updated_at),
    publisher: {
      '@type': 'Organization',
      name: 'Yokool',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/images/yokool-logo.png`,
      },
    },
    mainEntityOfPage: canonical,
  };
  if (post.og_image_url) jsonLd.image = post.og_image_url;
  if (post.author_name) jsonLd.author = { '@type': 'Person', name: post.author_name };

  // ============================================================
  // FAQ Schema - parse từ content_html nếu có FAQ block
  // SEO: tạo cơ hội xuất hiện Rich Snippet FAQ trên Google
  // ============================================================
  const faqSchema = extractFaqSchema(post.content_html || '');

  // Inject FAQ schema vào head (script JSON-LD thứ 2)
  const faqJsonLdScript = faqSchema
    ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`
    : '';

  const headHtml = renderHead({
    title: `${title} — Yokool`,
    description,
    canonical,
    ogTitle: post.og_title || title,
    ogDescription: post.og_description || description,
    ogImage: post.og_image_url || `${baseUrl}/images/banner-1.jpg`,
    ogType: post.og_type || 'article',
    robots,
    publishedTime: isoDate(post.published_at),
    modifiedTime: isoDate(post.updated_at),
    author: post.author_name,
    keywords: post.meta_keywords || undefined,
    jsonLd,
  });

  const dateStr = formatDateVN(post.published_at);

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
${headHtml}
${faqJsonLdScript}
</head>
<body>

${renderHeader()}

<article class="article">
  <div class="container">

    <nav class="article-breadcrumb" aria-label="Breadcrumb">
      <a href="/index.html">Trang chủ</a>
      <span aria-hidden="true">›</span>
      <a href="/news">Tin tức</a>
      <span aria-hidden="true">›</span>
      <span>${escapeHtml(post.title)}</span>
    </nav>

    <header class="article-header" data-title-align="${escapeHtml((post as any).title_align || 'left')}">
      ${post.category_name ? `<span class="article-category">${escapeHtml(post.category_name)}</span>` : ''}
      <h1 class="article-title" style="text-align: ${escapeHtml((post as any).title_align || 'left')}">${escapeHtml(post.title)}</h1>
      <div class="article-meta">
        ${dateStr ? `<time datetime="${isoDate(post.published_at)}">${escapeHtml(dateStr)}</time>` : ''}
        ${dateStr && post.reading_time ? `<span aria-hidden="true">·</span>` : ''}
        ${post.reading_time ? `<span>${post.reading_time} phút đọc</span>` : ''}
        ${post.author_name ? `<span aria-hidden="true">·</span><span>${escapeHtml(post.author_name)}</span>` : ''}
      </div>
    </header>

  </div>

  ${post.og_image_url ? `
  <div class="article-cover">
    <img src="${escapeHtml(post.og_image_url)}" alt="${escapeHtml(post.featured_image_alt || post.title)}" loading="eager">
  </div>` : ''}

  <div class="container">
    <div class="article-body">
      ${post.excerpt ? `<p class="article-lede">${escapeHtml(post.excerpt)}</p>` : ''}

      ${processContentHtml(post.content_html ?? '')}

      <div class="article-cta">
        <span class="article-cta-label">Khám phá thêm</span>
        <p class="article-cta-text">Xem bộ sưu tập sản phẩm Yokool — sạc thông minh, nhẹ gánh hành trình.</p>
        <a href="/index.html#products" class="cta-button">Xem sản phẩm <span class="cta-arrow">→</span></a>
      </div>
    </div>
  </div>

  ${renderRelatedSection(related)}

</article>

${renderFooter()}

</body>
</html>`;
}

function notFoundHtml(): string {
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
  title: 'Không tìm thấy bài viết — Yokool',
  description: 'Bài viết bạn tìm có thể đã bị xoá hoặc URL không đúng.',
  canonical: '',
  robots: 'noindex, nofollow',
})}
</head>
<body>

${renderHeader()}

<section class="news-empty">
  <div class="container">
    <div class="news-empty-inner">
      <div class="news-empty-mark">✦</div>
      <h1 class="news-empty-title">Không tìm thấy bài viết</h1>
      <p class="news-empty-description">Bài viết bạn đang tìm có thể đã bị xoá hoặc URL không đúng. Quay lại trang Tin tức để xem các bài khác nhé.</p>
      <div class="news-empty-actions">
        <a href="/news" class="cta-button">
          Về trang Tin tức
          <span class="cta-arrow">→</span>
        </a>
        <a href="/index.html" class="cta-button cta-button--ghost">Về trang chủ</a>
      </div>
    </div>
  </div>
</section>

${renderFooter()}

</body>
</html>`;
}

// ============================================================
// Related Posts section
// ============================================================
function renderRelatedSection(related: Post[]): string {
  if (!related || related.length === 0) return '';

  const cards = related.map((p) => `
    <a href="/news/${escapeHtml(p.slug)}" class="related-card">
      <div class="related-card-thumb">
        ${p.og_image_url
          ? `<img src="${escapeHtml(p.og_image_url)}" alt="" loading="lazy">`
          : `<img src="/images/banner-1.jpg" alt="" loading="lazy">`}
      </div>
      <div class="related-card-body">
        ${p.category_name ? `<span class="related-card-category">${escapeHtml(p.category_name)}</span>` : ''}
        <h3 class="related-card-title">${escapeHtml(p.title)}</h3>
      </div>
    </a>
  `).join('\n');

  return `
  <section class="article-related-section" aria-label="Bài viết liên quan">
    <h2>Đọc thêm</h2>
    <div class="article-related-grid">
      ${cards}
    </div>
  </section>`;
}

// ============================================================
// FAQ Schema Extractor
// Parse FAQ blocks từ content_html của bài viết
// HTML structure (từ Tiptap FAQ extension):
//   <div class="faq-section" data-faq="true">
//     <details class="faq-item">
//       <summary class="faq-question">Question?</summary>
//       <div class="faq-answer"><p>Answer...</p></div>
//     </details>
//     ...
//   </div>
// ============================================================
function extractFaqSchema(html: string): any | null {
  if (!html || !html.includes('class="faq-item"')) return null;

  const faqs: Array<{ question: string; answer: string }> = [];

  // Regex parse từng faq-item
  const itemPattern = /<details[^>]*class="[^"]*faq-item[^"]*"[^>]*>([\s\S]*?)<\/details>/gi;
  let match;
  while ((match = itemPattern.exec(html)) !== null) {
    const itemHtml = match[1];

    // Extract question (summary)
    const qMatch = /<summary[^>]*class="[^"]*faq-question[^"]*"[^>]*>([\s\S]*?)<\/summary>/i.exec(itemHtml);
    // Extract answer (div)
    const aMatch = /<div[^>]*class="[^"]*faq-answer[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(itemHtml);

    if (qMatch && aMatch) {
      const question = stripTags(qMatch[1]).trim();
      const answer = stripTags(aMatch[1]).trim();
      if (question && answer) {
        faqs.push({ question, answer });
      }
    }
  }

  if (faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// Process content HTML before rendering on frontend
// - Strip "open" attribute từ <details class="faq-item">
//   để FAQ mặc định đóng trên website (user click để mở)
// - Áp dụng cho cả bài cũ và bài mới (fix retroactive)
// ============================================================
function processContentHtml(html: string): string {
  if (!html) return '';

  // Pattern: <details class="faq-item" open="true"> hoặc <details ... open ...>
  // Match cả các biến thể: open, open="true", open="", open='true'
  return html.replace(
    /<details([^>]*?\bclass="[^"]*\bfaq-item\b[^"]*"[^>]*?)>/gi,
    (match, attrs) => {
      // Strip open attribute (có thể có hoặc không có value)
      const cleanedAttrs = attrs.replace(/\s+open(?:\s*=\s*(?:"[^"]*"|'[^']*'|\S+))?/gi, '');
      return `<details${cleanedAttrs}>`;
    }
  );
}
