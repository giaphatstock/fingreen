import React, { useState } from 'react'
import { Player } from '@remotion/player'
import { RemotionFintechComposition } from './RemotionFintechVideo'
import { calculateSlideTiming } from '../../utils/slideTimingUtils'
import { Volume2, Sparkles, Wand2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RemotionPlayerWrapper({ campaign, onFinish }) {
  const [selectedVoice, setSelectedVoice] = useState('nam') // 'nam' | 'nu'
  const slides = campaign?.slides || []

  // Tính toán thời lượng frame chuẩn xác theo nhịp điệu đọc từng từ của BTV (+16%)
  const { totalDurationFrames } = calculateSlideTiming(slides, 30)

  return (
    <div className="flex flex-col items-center w-full max-w-sm">
      {/* THANH ĐIỀU KHIỂN & CHỌN GIỌNG BTV TRÊN CÙNG */}
      <div className="w-full mb-3 flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Remotion Engine (OpenDesign)</span>
        </span>

        {/* Nút đổi giọng BTV Nam / Nữ */}
        <button
          type="button"
          onClick={() => {
            const next = selectedVoice === 'nam' ? 'nu' : 'nam'
            setSelectedVoice(next)
            toast.success(`Đã chuyển sang giọng ${next === 'nam' ? 'BTV Nam Minh' : 'BTV Hoài My'}!`)
          }}
          className="px-3 py-1 rounded-xl bg-slate-900 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow"
        >
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{selectedVoice === 'nam' ? '🎙️ BTV Nam Minh' : '🎙️ BTV Hoài My'}</span>
        </button>
      </div>

      {/* KHUNG VIDEO TIKTOK 9:16 REMOTION NATIVE */}
      <div className="relative w-[320px] sm:w-[350px] h-[580px] sm:h-[620px] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-black">
        <Player
          component={RemotionFintechComposition}
          inputProps={{
            campaign,
            selectedVoice
          }}
          durationInFrames={totalDurationFrames}
          compositionWidth={360}
          compositionHeight={640}
          fps={30}
          style={{
            width: '100%',
            height: '100%'
          }}
          controls
          autoPlay={false}
          loop={false}
        />
      </div>

      {/* THÔNG TIN & GHI CHÚ BẢN QUYỀN */}
      <div className="w-full mt-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-center space-y-1">
        <p className="text-[11px] font-semibold text-slate-300 line-clamp-1">
          Chủ đề: <span className="text-emerald-400 font-bold">{campaign?.title || 'Video Phân Tích'}</span>
        </p>
        <p className="text-[10px] text-slate-400">
          Render bởi <strong className="text-emerald-400">OpenDesign Remotion Grid</strong> & <strong className="text-amber-400">Neural Voice (+16%)</strong>
        </p>
      </div>
    </div>
  )
}
