// ============================================================
// /functions/news/[slug].ts
// Trang chi tiết bài viết - VÔ HIỆU HOÁ
// Tamayoko không lấy bài viết từ CloudCMS. Mọi URL bài viết đều
// trả về trang "không có bài viết".
// ============================================================

import {
  type Env,
  renderHead, renderHeader, renderFooter,
} from '../_lib/cloudcms';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const baseUrl = url.origin;

  return new Response(notFoundHtml(baseUrl), {
    status: 404,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=600',
    },
  });
};

function notFoundHtml(baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
${renderHead({
  title: 'Không tìm thấy bài viết — Yokool',
  description: 'Hiện chưa có bài viết nào.',
  canonical: `${baseUrl}/news`,
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
      <p class="news-empty-description">Hiện chưa có bài viết nào. Vui lòng quay lại sau.</p>
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
