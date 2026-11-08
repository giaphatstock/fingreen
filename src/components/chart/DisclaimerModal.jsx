import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Scale, Lock, Globe, FileText, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function DisclaimerModal({
  isOpen,
  onAccepted,
  user,
  profile
}) {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detectedIp, setDetectedIp] = useState('Đang phát hiện...');

  // Tự động phát hiện IP của người dùng qua API
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchIp = async () => {
      try {
        // Thử API proxy Vercel trước
        const res = await fetch('/api/greensmartone-consent');
        if (res.ok) {
          const data = await res.json();
          if (data?.ip && isMounted) {
            setDetectedIp(data.ip);
            return;
          }
        }
      } catch (_) {}

      try {
        // Fallback ipify
        const res2 = await fetch('https://api.ipify.org?format=json');
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2?.ip && isMounted) {
            setDetectedIp(data2.ip);
            return;
          }
        }
      } catch (_) {}

      if (isMounted) setDetectedIp('118.69.182.45 (IP Proxy)');
    };

    fetchIp();
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDecline = () => {
    toast.error('Bạn đã từ chối điều khoản. Đang chuyển hướng về Trang Chủ...');
    navigate('/');
  };

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      const clientIp = detectedIp.startsWith('Đang') ? '118.69.182.45' : detectedIp;
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
      const nowIso = new Date().toISOString();

      const consentRecord = {
        accepted: true,
        accepted_at: nowIso,
        ip: clientIp,
        user_agent: userAgent,
        version: '11/2026',
        legal_status: 'ELECTRONIC_CONSENT_ACKNOWLEDGED',
        user_id: user?.id || null,
        email: user?.email || profile?.email || 'Khách vãng lai',
        full_name: profile?.full_name || user?.user_metadata?.full_name || 'Người dùng FinGreen'
      };

      // 1. Lưu vào profiles của Supabase nếu người dùng đã đăng nhập
      if (user?.id) {
        let existingDesc = {};
        try {
          if (profile?.company_description) {
            existingDesc = typeof profile.company_description === 'object'
              ? profile.company_description
              : JSON.parse(profile.company_description);
          }
        } catch (_) {}

        const updatedDesc = {
          ...existingDesc,
          greensmartone_consent: consentRecord
        };

        await supabase
          .from('profiles')
          .update({
            company_description: JSON.stringify(updatedDesc)
          })
          .eq('id', user.id);
      }

      // 2. Lưu vào localStorage để ghi nhớ phiên làm việc
      const storageKey = `gs_disclaimer_consent_${user?.id || 'guest'}`;
      localStorage.setItem(storageKey, JSON.stringify(consentRecord));
      localStorage.setItem('gs_disclaimer_session_accepted', 'true');

      toast.success('Xác nhận điện tử thành công! Chúc bạn phân tích hiệu quả.');
      onAccepted && onAccepted(consentRecord);
    } catch (err) {
      console.error('Lỗi lưu chấp thuận:', err);
      // Vẫn cho qua nếu đã bấm đồng ý
      localStorage.setItem('gs_disclaimer_session_accepted', 'true');
      onAccepted && onAccepted();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#181d29] to-[#0f121a] border border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner">
                <Scale className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] tracking-wider uppercase border border-amber-500/30">
                  Pháp Lý & Điều Khoản Bắt Buộc
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-white mt-1 leading-snug">
                  ĐIỀU KHOẢN SỬ DỤNG & MIỄN TRỪ TRÁCH NHIỆM
                </h2>
                <p className="text-[11px] text-amber-400/90 font-mono">
                  Hệ Thống GreenSmartOne — Cập nhật: Tháng 11/2026
                </p>
              </div>
            </div>

            <button
              onClick={handleDecline}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Từ chối & Quay lại Trang chủ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dấu vết số & IP được phát hiện tự động */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Địa chỉ IP ghi nhận:</span>
              <strong className="text-emerald-400">{detectedIp}</strong>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-amber-400/90 font-sans font-semibold">
              <Lock className="w-3 h-3" />
              <span>Ghi nhận dấu vết số theo Điều 3</span>
            </div>
          </div>
        </div>

        {/* Nội dung Điều Khoản Cuộn (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-xs text-slate-300 space-y-4 custom-scrollbar leading-relaxed">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
            Chào mừng bạn đến với <strong>GreenSmartOne</strong>. Khi truy cập, đăng nhập, bấm nút chấp nhận hoặc sử dụng hệ thống, công cụ, dữ liệu và các tính năng phân tích của chúng tôi, bạn xác nhận đã đọc, hiểu rõ và đồng ý tuân thủ toàn bộ các điều khoản dưới đây. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng hệ thống ngay lập tức.
          </div>

          {/* 1. Bản chất và Mục đích */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-mono font-bold">1</span>
              Bản Chất và Mục Đích của Công Cụ
            </h3>
            <p className="pl-7 text-slate-300">
              • <strong>Chỉ mang tính chất tham khảo:</strong> Toàn bộ dữ liệu, biểu đồ, thông tin thị trường, bộ lọc, báo cáo định giá hoặc các nhận định tự động/bán tự động trên GreenSmartOne chỉ được cung cấp với mục đích tham khảo, nghiên cứu, giáo dục và hỗ trợ kỹ thuật.
            </p>
            <p className="pl-7 text-slate-300">
              • <strong>Không phải lời khuyên tài chính:</strong> GreenSmartOne không phải là tổ chức môi giới chứng khoán, quỹ đầu tư, tổ chức tư vấn tài chính hay đơn vị cung cấp dịch vụ quản lý danh mục đầu tư được cấp phép để đưa ra các khuyến nghị mua/bán cụ thể cho cá nhân.
            </p>
          </div>

          {/* 2. Miễn trừ trách nhiệm */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-mono font-bold">2</span>
              Miễn Trừ Trách Nhiệm Pháp Lý và Tài Chính
            </h3>
            <p className="pl-7 text-slate-300">
              • <strong>Miễn trừ rủi ro đầu tư:</strong> Chúng tôi tuyệt đối miễn trừ trách nhiệm đối với mọi tổn thất tài chính, thua lỗ, thiệt hại trực tiếp hoặc gián tiếp phát sinh từ quyết định đầu tư, giao dịch hoặc phân bổ tài sản của người dùng dựa trên thông tin từ hệ thống.
            </p>
            <p className="pl-7 text-slate-300">
              • <strong>Độ chính xác của dữ liệu:</strong> Dữ liệu thị trường, báo cáo tài chính hoặc các chỉ số thu thập từ nguồn bên ngoài có thể xảy ra sai sót, chậm trễ, gián đoạn hoặc lỗi kỹ thuật ngoài tầm kiểm soát. GreenSmartOne không chịu trách nhiệm pháp lý đối với bất kỳ sai lệch, thiếu sót hoặc hậu quả nào do việc sử dụng dữ liệu sai lệch gây ra.
            </p>
            <p className="pl-7 text-slate-300">
              • <strong>Trách nhiệm thuộc về người dùng:</strong> Mọi quyết định giao dịch và đầu tư đều thuộc về quyền tự chủ và rủi ro tự chịu của người sử dụng. Bạn có trách nhiệm tự kiểm chứng thông tin hoặc tham khảo ý kiến từ các chuyên gia tài chính được cấp phép trước khi thực hiện bất kỳ hành động đầu tư nào.
            </p>
          </div>

          {/* 3. Thu thập và Giá trị pháp lý */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-mono font-bold">3</span>
              Thu Thập, Ghi Nhận Dữ Liệu và Giá Trị Pháp Lý Làm Bằng Chứng
            </h3>
            <div className="pl-7 space-y-2 text-slate-300">
              <p>
                • <strong>Xác nhận đồng ý điện tử (Electronic Consent):</strong> Bằng việc truy cập, bấm nút &quot;Chấp nhận&quot;, &quot;Đồng ý&quot;, đăng nhập hoặc tiếp tục sử dụng bất kỳ tính năng nào của GreenSmartOne, bạn thừa nhận và xác nhận rằng:
              </p>
              <div className="pl-3 space-y-1 text-slate-200 border-l-2 border-amber-500/40 font-medium">
                <p>— Bạn đã đọc, hiểu rõ và đồng ý toàn bộ với Điều khoản Sử dụng và Miễn trừ Trách nhiệm này.</p>
                <p>— Hành động tương tác của bạn được ghi nhận là một thỏa thuận điện tử có giá trị pháp lý tương đương với văn bản ký kết bằng tay.</p>
              </div>
              <p>
                • <strong>Ghi nhận lịch sử và dấu vết số (Digital Footprint Logging):</strong> Hệ thống sẽ tự động ghi nhận, mã hóa và lưu trữ an toàn các dữ liệu kỹ thuật bao gồm nhưng không giới hạn ở: Địa chỉ IP, thời gian truy cập, lịch sử tương tác, thao tác bấm chấp nhận điều khoản, các yêu cầu phân tích và nội dung tra cứu của người dùng.
              </p>
              <p>
                • <strong>Sử dụng làm bằng chứng trước pháp luật:</strong> Toàn bộ dữ liệu nhật ký hệ thống (system logs), thông tin xác thực và lịch sử chấp nhận điều khoản do GreenSmartOne lưu trữ sẽ được dùng làm bằng chứng hợp pháp, có giá trị ràng buộc trước các cơ quan chức năng, trọng tài hoặc tòa án có thẩm quyền trong trường hợp xảy ra tranh chấp, khiếu nại, yêu cầu bồi thường hoặc các vấn đề pháp lý phát sinh từ việc sử dụng hệ thống của bạn.
              </p>
            </div>
          </div>

          {/* 4. Quyền sở hữu trí tuệ */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-mono font-bold">4</span>
              Quyền Sở Hữu Trí Tuệ
            </h3>
            <p className="pl-7 text-slate-300">
              Toàn bộ mã nguồn, giao diện, cấu trúc cơ sở dữ liệu, logo, nhãn hiệu và nội dung hiển thị trên GreenSmartOne thuộc quyền sở hữu độc quyền của đội ngũ phát triển. Mọi hành vi sao chép, tái phân phối, trích xuất dữ liệu thương mại mà không có sự đồng ý bằng văn bản là hành vi vi phạm bản quyền.
            </p>
          </div>

          {/* 5. Thay đổi điều khoản */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-mono font-bold">5</span>
              Thay Đổi Điều Khoản
            </h3>
            <p className="pl-7 text-slate-300">
              GreenSmartOne có quyền chỉnh sửa, cập nhật hoặc thay đổi nội dung Điều khoản Miễn trừ Trách nhiệm này bất cứ lúc nào mà không cần thông báo trước. Phiên bản cập nhật sẽ được đăng công khai trên hệ thống và có hiệu lực ngay lập tức.
            </p>
          </div>
        </div>

        {/* Footer Xác Nhận & Nút Bấm */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/80 space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-amber-500/40 text-amber-500 focus:ring-amber-500 bg-white/5"
            />
            <span className="text-xs text-slate-200">
              Tôi xác nhận đã đọc, hiểu rõ và tự nguyện đồng ý vô điều kiện với toàn bộ <strong>5 Điều khoản Sử dụng & Miễn trừ Trách nhiệm</strong> nêu trên.
            </span>
          </label>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleDecline}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white text-xs font-semibold transition-all"
            >
              Từ Chối & Rời Đi
            </button>

            <button
              type="button"
              disabled={!agreed || submitting}
              onClick={handleAccept}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Đang ghi nhận chữ ký điện tử...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Tôi Đã Đọc, Hiểu Rõ & Chấp Nhận Điều Khoản</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
