// ============================================================
// /functions/news.ts
// Trang danh sách tin tức - LUÔN TRỐNG
// Tamayoko không lấy bài viết từ CloudCMS. Mục Tin tức để trống.
// ============================================================

import {
  type Env,
  renderHead, renderHeader, renderFooter,
} from './_lib/cloudcms';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const baseUrl = url.origin;

  return new Response(renderEmptyNewsPage(baseUrl), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=600',
    },
  });
};

function renderEmptyNewsPage(baseUrl: string): string {
  const title = 'Tin tức · Yokool';
  const description =
    'Tin tức công nghệ từ Yokool: hướng dẫn sử dụng sạc dự phòng, củ sạc nhanh GaN và ổ điện du lịch.';
  const canonical = `${baseUrl}/news`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
${renderHead({
  title,
  description,
  canonical,
  ogTitle: title,
  ogDescription: description,
  ogImage: `${baseUrl}/images/og-default.jpg`,
  ogType: 'website',
})}
</head>
<body>
${renderHeader()}

<main class="news-page-v2">
  <section class="news-hero-v2">
    <div class="container">
      <span class="news-eyebrow">/ Yokool blog</span>
      <h1 class="news-h1">Hướng dẫn · Đánh giá <em>· Câu chuyện.</em></h1>
      <p class="news-h1-sub">Cập nhật tin tức công nghệ, mẹo sử dụng và đánh giá sản phẩm từ đội ngũ Yokool.</p>
    </div>
  </section>

  <section class="news-list-v2">
    <div class="container">
      <div class="news-empty-v2">
        <p>Hiện chưa có bài viết nào.</p>
      </div>
    </div>
  </section>
</main>

${renderFooter()}
</body>
</html>`;
}
