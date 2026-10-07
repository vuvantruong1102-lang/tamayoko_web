// ============================================================
// /functions/sitemap.xml.ts
// Sitemap tĩnh - CHỈ các trang chính.
// Tamayoko không lấy bài viết từ CloudCMS nên sitemap không liệt kê bài viết.
// Trả về XML cho /sitemap.xml
// ============================================================

import { type Env } from './_lib/cloudcms';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const baseUrl = url.origin;

  const staticUrls = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/news`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${baseUrl}/products/jp395.html`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/products/rc502.html`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/products/sl207.html`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/products/atlas20.html`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/products/nano.html`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/products/nomad25.html`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/products/atlas70.html`, priority: '0.9', changefreq: 'weekly' },
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
</urlset>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=600, s-maxage=3600',
    },
  });
};
