// =============================================================================
// FinGreen - Cấu hình OmniVoice / VoiceStudio (debpalash) Chuẩn Tiếng Việt 100%
// =============================================================================

export const OMNI_VOICE_CONFIG = {
  // Tên công cụ / Mã nguồn: debpalash/voicestudio (OmniVoice Engine)
  engine: 'OmniVoice',
  repo_url: 'https://github.com/debpalash/voicestudio',
  
  // ĐÚNG MÃ NGÔN NGỮ TIẾNG VIỆT TRONG MÃ NGUỒN OMNIVOICE:
  // OmniVoice và tokenizer đa ngôn ngữ của k2-fsa sử dụng mã ISO 639-1 chuẩn: 'vi' (hoặc 'vie')
  language: 'vi',
  language_full: 'Vietnamese',
  locale: 'vi-VN',
  
  // Model checkpoints tiếng Việt tối ưu cho OmniVoice:
  // 1. splendor1811/omnivoice-vietnamese: Được huấn luyện trên 1.000 giờ giọng đọc chuẩn tiếng Việt
  // 2. thanhhai03/OmniVoice-Luna-vi: Checkpoint đơn giọng nữ đọc tin tức truyền cảm
  // 3. k2-fsa/OmniVoice: Model gốc đa ngôn ngữ zero-shot cloning
  model_checkpoints: [
    {
      id: 'splendor1811/omnivoice-vietnamese',
      name: 'OmniVoice Vietnamese (1000h Tiếng Việt Chuẩn)',
      description: 'Độ tự nhiên cao nhất, phát âm chuẩn dấu hỏi ngã và thuật ngữ tài chính',
      recommended: true
    },
    {
      id: 'k2-fsa/OmniVoice',
      name: 'OmniVoice Base Multilingual (Zero-Shot Clone)',
      description: 'Hỗ trợ clone giọng mẫu bất kỳ từ đoạn ghi âm 3-10 giây',
      recommended: false
    }
  ],

  // Các thông số khuếch tán âm thanh (Diffusion Sampling) tối ưu cho tiếng Việt:
  generation_params: {
    language: 'vi',         // <-- BẮT BUỘC 'vi' để OmniVoice kích hoạt bộ từ vựng âm tiết tiếng Việt
    num_step: 16,           // 16 bước khử nhiễu (Denoising Steps) giúp giọng ấm, không bị rè tiếng
    guidance_scale: 2.0,    // Đảm bảo bám sát ngữ điệu tài chính
    speed: 1.05             // Tốc độ nhịp đọc nhanh nhẹn, cuốn hút chuẩn TikTok
  }
}

// Hàm kiểm tra cấu hình ngôn ngữ đã đúng chuẩn hay chưa
export function verifyOmniVoiceVietnamese() {
  const isCorrectLanguage = OMNI_VOICE_CONFIG.language === 'vi'
  const isCorrectLocale = OMNI_VOICE_CONFIG.locale === 'vi-VN'
  return {
    valid: isCorrectLanguage && isCorrectLocale,
    languageCode: OMNI_VOICE_CONFIG.language,
    locale: OMNI_VOICE_CONFIG.locale,
    engine: OMNI_VOICE_CONFIG.engine,
    recommendedModel: OMNI_VOICE_CONFIG.model_checkpoints[0].id,
    status: isCorrectLanguage ? 'ĐÃ CHỌN ĐÚNG VIETNAMESE (language="vi")' : 'SAI MÃ NGÔN NGỮ'
  }
}
