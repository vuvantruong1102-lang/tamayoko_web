# Tamayoko Website — v2.0

Website tĩnh cho thương hiệu Tamayoko, giao diện sáng (light theme) với màu chủ đạo **#DC143B** (crimson red). Pure HTML/CSS/JS — không framework, không build step.

## Cấu trúc thư mục

```
Tamayoko/
├── index.html              ← Trang chủ (carousel + product grid)
├── news.html               ← Trang Tin tức (placeholder)
├── checkout.html           ← Trang thanh toán (đặt hàng COD)
├── styles.css              ← CSS dùng chung cho cả site
├── script.js               ← JavaScript (carousel, menu, cart, checkout)
├── README.md               ← File này
├── images/                 ← Ảnh và banner (đều là .jpg / .png)
│   ├── Tamayoko-logo.png     ← Logo thương hiệu (nền trong suốt)
│   ├── banner-1.jpg        ← Banner slide 1 — 1600×600
│   ├── banner-2.jpg        ← Banner slide 2 — 1600×600
│   ├── banner-3.jpg        ← Banner slide 3 — 1600×600
│   ├── product-sl207.jpg   ← Ảnh sản phẩm SL207 — 800×800
│   ├── product-ol212.jpg   ← Ảnh sản phẩm OL212 — 800×800
│   ├── product-jp395.jpg   ← Ảnh sản phẩm JP395 — 800×800
│   └── product-rc502.jpg   ← Ảnh sản phẩm RC502 — 800×800
└── products/               ← Trang chi tiết từng sản phẩm
    ├── sl207.html
    ├── ol212.html
    ├── jp395.html
    └── rc502.html
```

## Tính năng e-commerce (v3.0)

### Giỏ hàng (localStorage)
- Click "Thêm vào giỏ hàng" trên trang sản phẩm → toast thông báo, badge cart icon update
- Click cart icon ở header → drawer trượt từ phải vào hiển thị giỏ hàng
- Trong drawer: tăng/giảm số lượng, xoá item, xem tổng tiền
- Click "Thanh toán" trong drawer → đi đến checkout.html với toàn bộ cart

### Mua ngay (skip cart)
- Click "Mua ngay" trên trang sản phẩm → đi thẳng đến checkout.html chỉ với 1 sản phẩm đó
- Cart hiện tại không bị ảnh hưởng (lưu sessionStorage riêng)

### Trang Checkout
- Form thông tin nhận hàng: Họ tên, SĐT, Email, Tỉnh/Thành, Địa chỉ, Ghi chú
- Validation: tên/sđt/địa chỉ bắt buộc, SĐT đúng định dạng VN (0xxxxxxxxx)
- Order summary sidebar: list items, tổng tiền, miễn phí ship
- Phương thức thanh toán: COD only (Thanh toán khi nhận hàng)
- Click "Đặt hàng" → modal "Đặt hàng thành công" hiện ra với mã đơn

### Mã đơn hàng tự sinh
Format: `YK-YYMMDD-XXXX` (ví dụ: `YK-260517-3829`)

### Đơn hàng lưu ở đâu?
Hiện đang lưu vào `localStorage.Tamayoko_orders_v1`. Mở Console (F12) gõ:
```javascript
JSON.parse(localStorage.getItem('Tamayoko_orders_v1'))
```

## ⚠️ Quan trọng: cần tích hợp backend để nhận đơn thật

Hiện tại đơn hàng **chỉ lưu trên máy khách hàng** (localStorage trong browser của họ). Để Jay nhận được đơn, cần kết nối backend. 3 lựa chọn từ dễ đến chuyên nghiệp:

### Cách 1: Formspree (khuyến nghị cho mới bắt đầu)
1. Lên https://formspree.io → đăng ký free (50 đơn/tháng)
2. Tạo form, lấy URL endpoint kiểu `https://formspree.io/f/abc123`
3. Mở `script.js`, tìm comment `TODO Jay: integrate real backend here`
4. Thay bằng:
```javascript
fetch('https://formspree.io/f/abc123', {
  method: 'POST',
  body: JSON.stringify(order),
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
}).catch(err => console.error('Order send failed:', err));
```
5. Mỗi đơn sẽ vào email của Jay

### Cách 2: EmailJS
Tương tự nhưng dùng client-side gửi qua Gmail/Outlook. Free 200 đơn/tháng. Setup phức tạp hơn Formspree một chút.

### Cách 3: Cloudflare Worker (chuyên nghiệp nhất, miễn phí trên free tier)
Vì site đã host trên Cloudflare Pages, Jay có thể tạo Worker để nhận đơn, lưu vào D1 database hoặc gửi email/Telegram. Setup phức tạp nhất nhưng scale tốt nhất, không phụ thuộc bên thứ 3.

## Đổi giá sản phẩm

Mở từng file `products/*.html`, tìm `data-price="..."` và `price-current">...</span>`. Sửa cả 2 chỗ trong cùng file. Có 4 button có data-price ở mỗi trang (Mua ngay + Thêm vào giỏ + related products ở cuối) — sửa tất.

## Cấu trúc menu

```
Trang chủ
Sản phẩm  ▾ (hover/tap)
  ├─ Sạc dự phòng ›
  │     └─ JP395
  ├─ Củ sạc ›
  │     └─ RC502
  └─ Ổ điện du lịch ›
        ├─ SL207
        └─ OL212
Tin tức
Liên hệ
```

Trên desktop: hover để mở dropdown. Trên mobile: tap để toggle (accordion).

## Cách deploy lên Cloudflare Pages

### Cách 1: Upload qua GitHub (đã làm rồi, chỉ cần update repo)

1. Vào repo GitHub `vuvantruong1102-lang/Tamayoko-web`
2. **Xoá tất cả file cũ** trong repo (chọn từng file → Delete)
3. Upload toàn bộ nội dung **bên trong** thư mục `Tamayoko/` này lên repo (KHÔNG upload thư mục `Tamayoko/` mà upload các file/folder bên trong nó)
4. Cloudflare Pages sẽ tự động deploy lại trong 30-60 giây

**LƯU Ý**: Khi upload phải đảm bảo file `index.html` nằm ở root của repo, không phải trong subfolder `Tamayoko/index.html`.

### Cách 2: Drag & drop trực tiếp lên Cloudflare Pages

1. Vào Cloudflare dashboard → Pages → project `Tamayoko-web`
2. Click "Create deployment" → "Upload assets"
3. Kéo cả 4 thứ: `index.html`, `styles.css`, `script.js`, thư mục `images/`, thư mục `products/`
4. Click "Deploy site"

## Test local trước khi deploy

1. Giải nén file zip (đừng mở trực tiếp từ trong zip)
2. Vào thư mục `Tamayoko/`
3. Double-click `index.html`
4. Browser sẽ mở và hiển thị website

Nếu test trang sản phẩm: vào `products/` → double-click bất kỳ file `.html` nào.

## Tuỳ chỉnh

### Đổi link Shopee

Search & replace `https://shopee.vn/tamayokoofficial` trong tất cả file `.html` thành link Shopee thật của bạn.

### Đổi thông tin liên hệ

Trong `index.html`, tìm section `<section class="contact-section">` và sửa:
- Số hotline: `0971 222 822`
- Zalo: `zalo.me/0971222822`
- Email: `contact@tamayoko.com`

### Đổi màu thương hiệu

Trong `styles.css`, sửa biến CSS ở đầu file:

```css
:root {
  --brand: #DC143B;         /* màu chính */
  --brand-hover: #B30E2F;   /* màu hover (đậm hơn) */
}
```

### Thay ảnh placeholder bằng ảnh thật

Tất cả ảnh hiện tại là JPG placeholder do mình render từ thiết kế geometric. Để thay bằng ảnh AI hoặc ảnh chụp thật:

**Cách thay (đơn giản nhất)**:
1. Đặt ảnh của bạn với chính xác tên file cũ:
   - `images/product-sl207.jpg` — sản phẩm SL207
   - `images/product-ol212.jpg` — sản phẩm OL212
   - `images/product-jp395.jpg` — sản phẩm JP395
   - `images/product-rc502.jpg` — sản phẩm RC502
   - `images/banner-1.jpg`, `banner-2.jpg`, `banner-3.jpg` — 3 banner hero
2. Upload đè lên file cũ trên GitHub (cùng tên = tự thay)
3. Cloudflare tự build lại trong 30-60 giây

**Khuyến nghị kích thước**:
- Banner: **1600×600 px** (tỉ lệ 16:6, ảnh ngang). Nội dung quan trọng nên ở giữa-phải vì text overlay nằm bên trái.
- Sản phẩm: **800×800 px** (vuông). Nền trắng hoặc trong suốt sẽ hợp với theme nhất.
- Định dạng: JPG (file nhỏ, phù hợp ảnh chụp) hoặc PNG (nếu cần nền trong suốt). Nếu dùng PNG, đổi đuôi file thành `.png` rồi sửa HTML.

**Lưu ý ảnh OL212.jpg Jay đã có**: nền đen của ảnh đó sẽ tương phản mạnh với theme trắng. Có thể:
- Giữ nguyên — sẽ nổi bật, hiện đại
- Hoặc dùng AI/Photoshop xoá nền đen → còn lại sản phẩm đặt trên nền trắng/trong suốt → hài hoà hơn với theme

## Tính năng đã có

- ✅ Hero carousel 3 slide tự xoay 6 giây, có nút prev/next, dots
- ✅ Carousel hỗ trợ vuốt trên mobile, mũi tên bàn phím
- ✅ Header dính khi cuộn, blur background
- ✅ Mobile menu (hamburger) tự thu khi click link
- ✅ Scroll reveal — phần tử mờ rồi hiện khi cuộn tới
- ✅ Smooth scroll khi click anchor link (#contact)
- ✅ Hoàn toàn responsive — đẹp trên mobile, tablet, desktop
- ✅ Tối ưu cho diacritic tiếng Việt (font Be Vietnam Pro)
- ✅ Nút "Mua tại Shopee" ở mọi nơi cần (header, hero, CTA cuối, related products)
- ✅ Không có form thanh toán online — chỉ link Shopee + form tư vấn

## Tính năng chưa có (có thể thêm sau)

- Form gửi yêu cầu tư vấn (cần backend hoặc dịch vụ như Formspree)
- Tích hợp Google Analytics
- Sitemap.xml + robots.txt cho SEO
- Open Graph image cho khi share Facebook/Zalo
- Trang blog/tin tức

## Câu hỏi thường gặp

**Q: Tại sao toàn bộ ảnh là JPG?**
A: JPG nén tốt cho ảnh chụp sản phẩm thật, file nhỏ, mọi browser đều hiển thị. Nếu cần nền trong suốt (logo, icon) thì dùng PNG, đổi đuôi `.jpg` → `.png` trong HTML.

**Q: Tôi muốn dùng WebP cho ảnh để load nhanh hơn?**
A: Hoàn toàn có thể. Đặt file `.webp` vào `images/`, sửa đuôi trong HTML. Cloudflare hỗ trợ WebP tốt và tự nén/optimize.

**Q: Sao không dùng React/Next.js?**
A: Site tĩnh đơn giản, vài trang sản phẩm. HTML thuần load nhanh hơn, dễ host miễn phí, không phải build. Khi nào cần dynamic (đặt hàng online, blog có quản trị) sẽ chuyển.

**Q: Cloudflare Pages có giới hạn gì?**
A: Free tier: unlimited bandwidth, 500 builds/tháng, 100 deploys/ngày. Quá đủ cho website thương mại nhỏ.

**Q: Nếu Cloudflare Pages chậm propagate?**
A: Đợi 30-60 giây, mở incognito để bypass cache, hoặc vào Cloudflare dashboard purge cache.

---

© 2026 Tamayoko — Made in Vietnam · v2.0 light theme · Powered by Cloudflare Pages
