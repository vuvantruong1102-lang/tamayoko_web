// ============================================================
// /functions/sitemap.xml.ts
// Sitemap động: kết hợp static URLs + bài viết từ CMS
// Trả về XML cho /sitemap.xml
// ============================================================

import { type Env, apiBase } from './_lib/cloudcms';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const baseUrl = url.origin;

  try {
    // Fetch sitemap từ API CMS (sitemap dạng XML)
    const apiUrl = `${apiBase(context.env)}/api/public/sitemap.xml`;
    const apiResp = await fetch(apiUrl, { cf: { cacheTtl: 600, cacheEverything: true } });

    let postsUrls = '';
    if (apiResp.ok) {
      const apiXml = await apiResp.text();
      // Parse rất đơn giản: extract các <url>...</url> blocks
      const matches = apiXml.match(/<url>[\s\S]*?<\/url>/g) || [];
      postsUrls = matches
        .map((u) =>
          u
            // CMS API có thể trả /blog/ (legacy), đổi sang /news/
            .replace(/\/blog\//g, '/news/')
            // Nếu host trong API là example.com (env SITE_URL chưa cấu hình),
            // thay bằng host yokool.vn thực tế
            .replace(/https?:\/\/example\.com/g, baseUrl)
            // Đảm bảo URL bài viết KHÔNG có .html (modern URL)
            .replace(/(\/news\/[^<]+?)\.html(<\/loc>)/g, '$1$2')
        )
        .join('\n');
    }

    // URLs static (các trang chính)
    const staticUrls = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/news`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/products/jp395.html`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${baseUrl}/products/rc502.html`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${baseUrl}/products/sl207.html`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${baseUrl}/products/ol212.html`, priority: '0.9', changefreq: 'weekly' },
      { loc: `${baseUrl}/b2b.html`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${baseUrl}/lien-he.html`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/bao-hanh.html`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/van-chuyen.html`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/faq.html`, priority: '0.5', changefreq: 'monthly' },
    ];

    const staticXml = staticUrls
      .map(
        (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticXml}
${postsUrls}
</urlset>`;

    return new Response(xml, {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, max-age=600, s-maxage=3600',
      },
    });
  } catch (err: any) {
    console.error('Sitemap error:', err);
    return new Response('Server error', { status: 500 });
  }
};
