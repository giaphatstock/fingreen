-- ====================================================================
-- FINGREEN - SUPABASE DATABASE & AUTH SECURITY HARDENING
-- Bản vá bảo mật toàn diện: RLS, Chống Leo Thang Đặc Quyền, Chống Rò Rỉ Dữ Liệu
-- Hướng dẫn: Mở Supabase Dashboard -> SQL Editor -> Dán toàn bộ nội dung này và bấm RUN
-- ====================================================================

-- 1. BẢO VỆ SEARCH_PATH CÁC HÀM POSTGRES (Tránh tấn công chiếm quyền search_path)
ALTER FUNCTION public.increment_view_count(uuid) SET search_path = 'public';

-- Thu hồi quyền gọi trực tiếp từ PostgREST API đối với hàm trigger tạo user
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;


-- 2. PHÂN QUYỀN TẠI BACKEND (DATABASE LEVEL) - CHỐNG LEO THANG ĐẶC QUYỀN (PRIVILEGE ESCALATION)
-- Tuyệt đối ngăn chặn người dùng thường tự sửa role thành admin_fingreen, tự mở khóa, hoặc tự gia hạn GreenSmartOne
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Chỉ tài khoản Admin mới có quyền thay đổi role, is_banned, is_approved, greensmartone_expires_at
  IF NOT is_admin(auth.uid()) THEN
    -- Kiểm tra nếu người dùng cố tình đổi role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Từ chối truy cập: Bạn không có quyền thay đổi vai trò (role) người dùng.';
    END IF;
    -- Kiểm tra nếu cố tình đổi trạng thái khóa tài khoản
    IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
      RAISE EXCEPTION 'Từ chối truy cập: Bạn không có quyền khóa hoặc mở khóa tài khoản.';
    END IF;
    -- Kiểm tra nếu cố tình đổi quyền phê duyệt đối tác
    IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
      RAISE EXCEPTION 'Từ chối truy cập: Bạn không có quyền phê duyệt quyền đối tác.';
    END IF;
    -- Kiểm tra nếu cố tình tự gia hạn bản quyền GreenSmartOne
    IF NEW.greensmartone_expires_at IS DISTINCT FROM OLD.greensmartone_expires_at THEN
      RAISE EXCEPTION 'Từ chối truy cập: Bạn không có quyền chỉnh sửa hạn sử dụng GreenSmartOne.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_fields();


-- 3. SIẾT CHẶT RLS (ROW LEVEL SECURITY) - CHỐNG RÒ RỈ THÔNG TIN NHẠY CẢM
-- Xóa bỏ chính sách cũ cho phép Anon đọc toàn bộ bảng profiles (gây rò rỉ Email, SĐT, IP, Nhật ký)
DROP POLICY IF EXISTS "Anon can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view post authors" ON public.profiles;

-- Chính sách mới an toàn tuyệt đối:
-- Người dùng vãng lai hoặc người dùng khác chỉ được xem thông tin công khai của tác giả bài viết hoặc đối tác đã được duyệt
CREATE POLICY "Public can view post authors" ON public.profiles
FOR SELECT
TO anon, authenticated
USING (
  -- 1. Luôn xem được hồ sơ của chính mình
  (SELECT auth.uid()) = id
  -- 2. Admin xem được toàn bộ
  OR is_admin((SELECT auth.uid()))
  -- 3. Đối tác/CTV đã được admin phê duyệt hiển thị công khai
  OR (is_approved = true AND role IN ('doi_tac', 'cong_tac_vien', 'admin_fingreen'))
  -- 4. Tác giả của các bài viết đã xuất bản công khai
  OR EXISTS (
    SELECT 1 FROM public.posts pt 
    WHERE pt.author_id = profiles.id AND pt.status = 'published'
  )
);

-- ====================================================================
-- HƯỚNG DẪN CẤU HÌNH SUPABASE AUTH GỬI MÃ OTP (THAY VÌ LINK LOCALHOST):
-- 
-- 1. Vào Supabase Dashboard -> Authentication -> URL Configuration:
--    - Site URL: Điền tên miền thật https://fingreenvn.vercel.app
--    - Redirect URLs: Thêm:
--        https://fingreenvn.vercel.app/**
--        http://localhost:5173/**
--
-- 2. Vào Supabase Dashboard -> Authentication -> Email Templates:
--    - Chọn mục "Confirm signup":
--    - Sửa tiêu đề: Mã Xác Thực Kích Hoạt Tài Khoản FinGreen
--    - Nội dung mẫu email (thay thế thẻ link bằng mã OTP {{ .Token }}):
--
--      <h2>Chào mừng bạn đến với FinGreen!</h2>
--      <p>Mã xác thực (OTP) kích hoạt tài khoản của bạn là:</p>
--      <h1 style="font-size: 32px; letter-spacing: 6px; color: #10b981; font-family: monospace;">{{ .Token }}</h1>
--      <p>Mã này có hiệu lực trong vòng 60 phút. Vui lòng nhập mã này vào trang đăng ký để kích hoạt tài khoản.</p>
--
-- 3. Đảm bảo bật toggle "Confirm email" tại mục Authentication -> Providers -> Email
-- ====================================================================
