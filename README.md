# CỤM C — Frontend Yokoolwebnew (FIX news.html)

## Vấn đề

Bạn đã xóa `news.html` static nhưng chưa upload các Pages Functions để render động → URL `/news.html` fallback về `index.html`.

## Files cần upload (7 files)

```
Yokoolwebnew/
├── _routes.json                    ← NEW (chỉ định Pages Functions chạy cho URL nào)
├── blog-enhance.css                ← UPDATE (thêm styles cho /news.html)
├── blog-enhance.js                 ← UPDATE (đã có)
└── functions/                      ← Folder mới hoàn toàn
    ├── _lib/
    │   └── cloudcms.ts             ← Shared helpers
    ├── news.ts                     ← Trang DANH SÁCH /news.html
    ├── news/
    │   └── [slug].ts               ← Trang CHI TIẾT /news/<slug>.html
    └── sitemap.xml.ts              ← Sitemap động
```

## Cách upload

### Bước 1: Vào repo
https://github.com/vuvantruong1102-lang/Yokoolwebnew

### Bước 2: Add file → Upload files

Kéo các thứ sau vào (giữ đúng cấu trúc folder):
- File `_routes.json` (root)
- File `blog-enhance.css` (đè, root)
- File `blog-enhance.js` (đè, root)
- Folder `functions/` (cả folder + nội dung bên trong)

### Bước 3: Verify danh sách file trên GitHub

Phải thấy 7 file:
```
✓ _routes.json
✓ blog-enhance.css
✓ blog-enhance.js
✓ functions/_lib/cloudcms.ts
✓ functions/news.ts
✓ functions/news/[slug].ts
✓ functions/sitemap.xml.ts
```

### Bước 4: Commit

Commit message: `Add Pages Functions for /news.html and articles`

### Bước 5: Đợi Pages build (~2 phút)

Vào Cloudflare → Workers & Pages → yokool-vn (hoặc tên project) → Deployments
Đợi deployment mới có status **Active**.

## Test sau khi deploy

### Test 1: Trang danh sách
Mở https://yokool.vn/news.html (Ctrl+Shift+R)
→ Phải thấy danh sách 2 bài viết hiện có (OL212 vs SL207, Quà tặng công nghệ B2B)

### Test 2: Trang chi tiết
Click vào 1 bài → URL phải là https://yokool.vn/news/ol212-vs-sl207-chon-o-dien-du-lich-nap.html
→ Phải render đầy đủ nội dung bài viết

### Test 3: Sitemap
Mở https://yokool.vn/sitemap.xml
→ Phải thấy danh sách URLs đầy đủ: trang chủ, products/*, news, và các bài viết

## Troubleshooting

### Nếu /news.html vẫn về trang chủ
- Check `_routes.json` đã upload đúng vào root chưa
- Check Pages deployment đã xong chưa (status Active)
- Hard refresh (Ctrl+Shift+R) để bỏ cache trình duyệt

### Nếu hiện "Server error"
- Cloudflare Dashboard → Pages → project → Observability/Logs
- Xem error message cụ thể
