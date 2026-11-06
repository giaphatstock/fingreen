# FinGreen - Nền Tảng Phân Tích Chứng Khoán Chuyên Nghiệp 📈

> **FinGreen** - Kiến Tạo Giá Trị Thực. Hệ thống phân tích chứng khoán phân quyền đa cấp bậc (Admin FinGreen, Đối Tác IB, Cộng Tác Viên, Khách hàng) với giao diện Fintech hiện đại.

---

## ✨ Tính Năng Nổi Bật

- 🔐 **Xác thực & Phân quyền đa cấp**: Tích hợp Supabase Auth & RLS bảo mật cao (Admin FinGreen, Đối Tác IB, Cộng Tác Viên, Thành Viên/Khách).
- 🛡️ **Quản trị hệ thống (Admin Panel)**: Quản lý thành viên, phân quyền vai trò, khóa tài khoản/ban IP, xét duyệt đơn hợp tác và bài viết.
- ✍️ **Công cụ đăng bài chuyên nghiệp**:
  - Tích hợp **TipTap Rich Editor** (định dạng văn bản, ảnh, trích dẫn, heading, link).
  - 5 Bộ template chuẩn: Tin Tức Thị Trường, Phân Tích Kỹ Thuật, Tín Hiệu Mua/Bán, Báo Cáo Doanh Nghiệp, Tin Nhanh.
  - Tự động gắn hashtag mã cổ phiếu (`#VNM`, `#VCB`, `#HPG`,...).
  - Tự động gắn mốc thời gian đăng tải chuẩn **Giờ Hà Nội (Asia/Ho_Chi_Minh)**.
- 🤝 **Cổng đăng ký Đối Tác IB & Cộng Tác Viên**: Tiếp nhận thông tin và xét duyệt trước khi cấp quyền đăng bài.
- 🎨 **Thiết kế Fintech cao cấp**: Giao diện tông màu tím chủ đạo (`#5154F0`, `#8587F4`, `#7D7FF4`, `#A8AAF8`), hiệu ứng glassmorphism, Dark mode chuẩn hiện đại, responsive trên mobile và desktop.
- ⏱️ **Cơ chế chống spam**: Giới hạn thời gian chờ 5s giữa các lần thao tác nhạy cảm.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 18, Vite 6, Tailwind CSS, Lucide React, TipTap Editor, React Router DOM, React Hot Toast.
- **Backend / Database**: Supabase (PostgreSQL, Supabase Auth, Row Level Security - RLS).

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Clone repository
```bash
git clone https://github.com/giaphatstock/fingreen.git
cd fingreen
```

### 2. Cài đặt thư viện
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` từ `.env.example`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Chạy chế độ phát triển (Development)
```bash
npm run dev
```
Truy cập tại: `http://localhost:5173`

### 5. Build sản phẩm (Production)
```bash
npm run build
```

---

© 2024 FinGreen. Kiến Tạo Giá Trị Thực.
