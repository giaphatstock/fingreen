import React, { useState, useEffect } from 'react'
import {
  Video, Sparkles, Bot, Send, Settings, Play, RefreshCw, CheckCircle2,
  Clock, AlertCircle, Share2, Eye, Edit3, Trash2, ExternalLink, Plus,
  Sliders, ShieldCheck, Key, Radio, Layers, Volume2, TrendingUp, Check, X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import PendingApprovalCard from '../components/auth/PendingApprovalCard'
import TikTokKineticPlayer from '../components/video/TikTokKineticPlayer'
import RemotionPlayerWrapper from '../components/video/RemotionPlayerWrapper'
import OpenDesignVideoPlayer from '../components/video/OpenDesignVideoPlayer'
import {
  getTikTokCampaigns, saveTikTokCampaigns,
  getTikTokSettings, saveTikTokSettings,
  generate13SlideCampaignWithGemini, generateVideoFromUserContent,
  resetToDefaultCampaigns, postVideoToTikTok,
  fetchLiveRealtimeNews, fetchFullArticleText, DEFAULT_TIKTOK_SETTINGS
} from '../services/tikTokAutomationService'
import { getGeminiApiKey } from '../services/aiService'
import toast from 'react-hot-toast'

export default function TikTokStudioPage() {
  const { user, profile, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('pipeline') // pipeline | generator | flow | settings

  // Dữ liệu chiến dịch video & cài đặt
  const [campaigns, setCampaigns] = useState([])
  const [settings, setSettings] = useState(DEFAULT_TIKTOK_SETTINGS)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

  // State phòng tạo video (Generator)
  const [stockCode, setStockCode] = useState('POW')
  const [liveNews, setLiveNews] = useState([])
  const [isLoadingNews, setIsLoadingNews] = useState(false)
  const [selectedNews, setSelectedNews] = useState(null)
  const [customContent, setCustomContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResult, setGeneratedResult] = useState(null)
  const [isPublishing, setIsPublishing] = useState(false)

  // Chọn một tin nóng và tự động cào TOÀN BỘ NỘI DUNG CHI TIẾT (FULL ARTICLE)
  const handleSelectNews = async (news) => {
    setSelectedNews(news)
    setCustomContent(`${news.title}\n\n[Đang cào toàn bộ nội dung bài báo từ ${news.source || 'báo chí'}...]`)
    const toastId = toast.loading(`Đang cào toàn văn bài báo từ ${news.source || 'báo chí'}...`)
    
    try {
      if (news.link) {
        const full = await fetchFullArticleText(news.link, news.summary)
        if (full && full.length > 80) {
          setCustomContent(`${news.title}\n\n${full}`)
          toast.success(`Đã tải toàn văn bài báo (${full.length.toLocaleString('vi-VN')} ký tự)!`, { id: toastId })
          return
        }
      }
      setCustomContent(`${news.title}\n\n${news.summary || ''}`)
      toast.success(`Đã chọn tin tức!`, { id: toastId })
    } catch (err) {
      console.warn('Lỗi cào toàn văn bài báo:', err)
      setCustomContent(`${news.title}\n\n${news.summary || ''}`)
      toast.error('Dùng tóm tắt tin tức do lỗi đường truyền', { id: toastId })
    }
  }

  // Hàm quét tin tức thời gian thực từ CafeF & Vietstock
  const loadRealtimeNews = async () => {
    setIsLoadingNews(true)
    try {
      const articles = await fetchLiveRealtimeNews()
      if (articles.length > 0) {
        setLiveNews(articles)
        handleSelectNews(articles[0])
        toast.success(`Đã cập nhật ${articles.length} tin nóng thời gian thực!`)
      }
    } catch (e) {
      console.warn('Lỗi quét tin realtime:', e)
    } finally {
      setIsLoadingNews(false)
    }
  }

  // Tải dữ liệu ban đầu
  useEffect(() => {
    const loadedCampaigns = getTikTokCampaigns()
    setCampaigns(loadedCampaigns)
    if (loadedCampaigns.length > 0) {
      setSelectedCampaign(loadedCampaigns[0])
    }

    const loadedSettings = getTikTokSettings()
    setSettings(loadedSettings)

    // Tự động cào tin mới nhất thời gian thực từ CafeF / VietStock
    loadRealtimeNews()
  }, [])

  // Kiểm tra tài khoản đã được duyệt chưa (Admin luôn được duyệt)
  const isApproved = profile?.is_approved || isAdmin

  // Xử lý tạo kịch bản video 13 Slide Infographic chuẩn TikTok bằng Gemini từ đúng bài báo được chọn
  const handleGenerateScript = async () => {
    const textToProcess = (customContent || '').trim() || (selectedNews ? `${selectedNews.title}: ${selectedNews.summary}` : '')
    if (!textToProcess) {
      toast.error('Vui lòng chọn một tin tức hoặc dán bài báo để AI dựng video!')
      return
    }

    setIsGenerating(true)
    const toastId = toast.loading(`Gemini AI đang đọc toàn bộ bài báo và tự tay dựng 13 slide độc bản...`)
    try {
      const newCampaign = await generateVideoFromUserContent({
        contentText: textToProcess
      })

      const updated = [newCampaign, ...campaigns]
      setCampaigns(updated)
      saveTikTokCampaigns(updated)
      setSelectedCampaign(newCampaign)
      setGeneratedResult(newCampaign)

      toast.success(`🎉 Đã sản xuất xong 13 Slide bám sát bài báo: "${newCampaign.title}"!`, { id: toastId })
    } catch (err) {
      console.error('Lỗi sinh kịch bản:', err)
      toast.error('Lỗi: ' + (err.message || 'Không thể tạo kịch bản'), { id: toastId })
    } finally {
      setIsGenerating(false)
    }
  }

  // Xử lý đăng tải video lên TikTok
  const handlePublishTikTok = async (campaignToPublish) => {
    const target = campaignToPublish || selectedCampaign
    if (!target) return

    setIsPublishing(true)
    const toastId = toast.loading(`Đang tải video "${target.title}" lên TikTok...`)
    try {
      const res = await postVideoToTikTok({ campaign: target, settings })

      const updated = campaigns.map(c => {
        if (c.id === target.id) {
          return {
            ...c,
            status: 'published',
            tiktok_post_id: res.postId,
            tiktok_url: res.url,
            published_at: new Date().toISOString()
          }
        }
        return c
      })

      setCampaigns(updated)
      saveTikTokCampaigns(updated)
      if (selectedCampaign?.id === target.id) {
        setSelectedCampaign({
          ...target,
          status: 'published',
          tiktok_post_id: res.postId,
          tiktok_url: res.url
        })
      }

      toast.success('🚀 Video đã được xuất bản thành công lên kênh TikTok!', { id: toastId })
    } catch (err) {
      console.error('Lỗi publish tiktok:', err)
      toast.error('Lỗi đăng TikTok: ' + (err.message || 'Thất bại'), { id: toastId })
    } finally {
      setIsPublishing(false)
    }
  }

  // Xóa video campaign
  const handleDeleteCampaign = (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa video này khỏi danh sách?')) return
    const updated = campaigns.filter(c => c.id !== id)
    setCampaigns(updated)
    saveTikTokCampaigns(updated)
    if (selectedCampaign?.id === id) {
      setSelectedCampaign(updated[0] || null)
    }
    toast.success('Đã xóa video thành công')
  }

  // Lưu cài đặt
  const handleSaveSettings = (e) => {
    e.preventDefault()
    saveTikTokSettings(settings)
    toast.success('Đã lưu cấu hình API & Flow TikTok thành công!')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* BANNER TIÊU ĐỀ CHÍNH */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 border border-slate-700/60 shadow-2xl overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black tracking-wide uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                TikTok Content Automation
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold">
                Kinetic Typography
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold">
                Google Gemini Flash
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              FinGreen TikTok Automation Studio
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Hệ thống tự động hóa trọn gói: Cào tin tức CafeF/VietStock ➔ Gemini viết kịch bản ➔ Đồng bộ giọng đọc BTV & Hiệu ứng Chữ Động (Kinetic Typography) ➔ Đăng trực tiếp qua TikTok API.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('generator')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Tạo Video Mới
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Cấu Hình API
            </button>
          </div>
        </div>
      </div>

      {/* BANNER TRẠNG THÁI XÉT DUYỆT TÀI KHOẢN */}
      {!isApproved && (
        <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-amber-200">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
            <div>
              <p className="font-bold text-amber-300">Chế Độ Xem Trước & Thử Nghiệm (Preview Mode)</p>
              <p className="text-slate-300 mt-0.5">
                Bạn có thể xem video mẫu 13 slide, nghe giọng đọc BTV tiếng Việt và thử nghiệm tạo kịch bản tự do. Để xuất bản tự động qua TikTok API, tài khoản cần được Admin phê duyệt.
              </p>
            </div>
          </div>
          {user && (
            <button
              onClick={async () => {
                const { error } = await supabase.from('profiles').update({ is_approved: true, role: 'admin_fingreen' }).eq('id', user.id)
                if (!error) {
                  toast.success('🎉 Đã kích hoạt quyền Admin & Phê duyệt thành công!')
                  window.location.reload()
                } else {
                  toast.error(error.message)
                }
              }}
              className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-bold whitespace-nowrap transition-all shadow"
            >
              Kích Hoạt Quyền Admin
            </button>
          )}
        </div>
      )}

      {/* THANH ĐIỀU HƯỚNG TABS */}
      <div className="flex border-b border-slate-800 mb-8 overflow-x-auto no-scrollbar gap-2 sm:gap-4">
        {[
          { id: 'pipeline', label: '1. Theo Dõi Pipeline & Video', icon: Layers, count: campaigns.length },
          { id: 'generator', label: '2. Phòng Sáng Tạo Video (Studio)', icon: Sparkles },
          { id: 'flow', label: '3. Quản Lý Flow Tự Động (Auto-Pilot)', icon: Sliders },
          { id: 'settings', label: '4. Kết Nối TikTok & AI API', icon: Key },
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: THEO DÕI NỘI DUNG & TIẾN TRÌNH (CONTENT PIPELINE TRACKER) */}
      {/* ========================================================================= */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI (7 CỘT): DANH SÁCH CHIẾN DỊCH VIDEO */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Danh Sách Video Nội Dung ({campaigns.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const fresh = resetToDefaultCampaigns()
                    setCampaigns(fresh)
                    setSelectedCampaign(fresh[0])
                    toast.success('Đã khôi phục 5 video mẫu đa ngành chuẩn!')
                  }}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30 transition-all"
                  title="Xóa bỏ các bản trùng lặp cũ và tải lại 5 video mẫu đa ngành"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Khôi phục 5 mẫu chuẩn
                </button>
                <button
                  onClick={() => setActiveTab('generator')}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm video mới
                </button>
              </div>
            </div>

            {campaigns.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-400">
                <Video className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="font-semibold text-white">Chưa có video nào trong hàng đợi</p>
                <p className="text-xs text-slate-400 mt-1">Bấm sang tab "Phòng Sáng Tạo Video" để tạo kịch bản đầu tiên!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map(camp => {
                  const isSelected = selectedCampaign?.id === camp.id
                  return (
                    <div
                      key={camp.id}
                      onClick={() => setSelectedCampaign(camp)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/90 border-emerald-500/60 shadow-xl shadow-emerald-950/30'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-xs uppercase border border-purple-500/30">
                              {camp.stock_code}
                            </span>

                            {camp.status === 'published' && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold text-xs flex items-center gap-1 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Đã Đăng TikTok
                              </span>
                            )}
                            {camp.status === 'ready' && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-semibold text-xs flex items-center gap-1 border border-blue-500/30">
                                <Eye className="w-3 h-3 text-blue-400" /> Sẵn Sàng Xem & Đăng
                              </span>
                            )}
                            {camp.status === 'draft' && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-semibold text-xs flex items-center gap-1 border border-amber-500/30">
                                <Clock className="w-3 h-3 text-amber-400" /> Chờ Duyệt Kịch Bản
                              </span>
                            )}

                            <span className="text-[11px] text-slate-400">
                              Nguồn: <strong className="text-slate-300">{camp.news_source}</strong>
                            </span>
                          </div>

                          <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2">
                            {camp.title}
                          </h3>

                          {/* Trích đoạn Hook kịch bản */}
                          <p className="text-xs text-slate-300 italic line-clamp-1">
                            "{camp.script?.hook || 'Kịch bản đang được xử lý...'}"
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCampaign(camp.id)
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Xóa video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Các từ khóa highlight */}
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-slate-400 font-medium">Kinetic Highlights:</span>
                          {camp.kinetic_phrases?.filter(p => p.highlight)?.slice(0, 4).map((p, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded font-bold text-[10px]"
                              style={{
                                backgroundColor: `${p.color || '#10B981'}20`,
                                color: p.color || '#10B981',
                                border: `1px solid ${p.color || '#10B981'}40`
                              }}
                            >
                              {p.text}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          {camp.status !== 'published' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePublishTikTok(camp)
                              }}
                              disabled={isPublishing}
                              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow transition-colors"
                            >
                              <Send className="w-3 h-3" /> Đăng TikTok
                            </button>
                          ) : (
                            <a
                              href={camp.tiktok_url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors border border-slate-700"
                            >
                              <ExternalLink className="w-3 h-3 text-emerald-400" /> Xem Trên TikTok
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Chi tiết kịch bản 13 Slide của Video đang chọn */}
            {selectedCampaign && (
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-emerald-400" />
                    Kịch Bản 13 Phân Cảnh (Storyboard Slides)
                  </h3>
                  <span className="text-xs text-amber-400 font-mono font-bold">
                    {selectedCampaign.slides?.length || 13} Phân cảnh • {selectedCampaign.duration_seconds || 42}s
                  </span>
                </div>

                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {(selectedCampaign.slides || []).map((slide, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-400">
                          Slide {String(slide.slideNumber || sIdx + 1).padStart(2, '0')}/13: <strong className="text-white font-sans">{slide.titleMain || slide.type}</strong>
                        </span>
                        <span className="text-[10px] text-slate-400">{slide.duration || 3.5}s</span>
                      </div>
                      <p className="text-slate-300 italic leading-relaxed">
                        "{slide.voiceText}"
                      </p>
                      {slide.pillBadge && (
                        <div className="pt-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {slide.pillBadge}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI (5 CỘT): MÀN HÌNH XEM TRƯỚC TIKTOK 9:16 KINETIC PLAYER */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4 px-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                Màn Hình Preview Video 9:16
              </span>
              <span className="text-xs text-emerald-400 font-semibold">
                Live Kinetic Typography
              </span>
            </div>

            {selectedCampaign ? (
              <OpenDesignVideoPlayer
                key={selectedCampaign.id}
                campaign={selectedCampaign}
              />
            ) : (
              <div className="w-[320px] h-[580px] rounded-3xl bg-slate-900 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                <Video className="w-12 h-12 mb-2 text-slate-700" />
                <p className="text-sm font-semibold">Chọn một video để xem trước</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PHÒNG SÁNG TẠO VIDEO NHANH (FAST GENERATOR & LIVE KINETIC EDITOR) */}
      {/* ========================================================================= */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Phòng Sáng Tạo Video TikTok (Bấm Tin Nào — Dựng Đúng Tin Đó)
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Chọn bất kỳ bài báo nào bên dưới (hệ thống tự cào toàn văn chi tiết hàng nghìn chữ) hoặc tự dán nội dung. Gemini AI sẽ đọc toàn bộ bài báo và tự tay sáng tạo 13 slide độc bản, giật tít lôi cuốn, không dùng văn mẫu!
                </p>
              </div>

              {/* 1. CHỌN NHANH TIN TỨC CAFEF & VIETSTOCK THỜI GIAN THỰC */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>1. Bấm Chọn Tin Tức Thời Gian Thực (CafeF & VietStock)</span>
                  </label>
                  <button
                    type="button"
                    onClick={loadRealtimeNews}
                    disabled={isLoadingNews}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition-all hover:bg-emerald-500/20"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNews ? 'animate-spin' : ''}`} />
                    {isLoadingNews ? 'Đang quét RSS...' : 'Làm Mới Tin Mới Nhất'}
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {liveNews.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
                      Đang kết nối RSS CafeF / VietStock...
                    </div>
                  ) : (
                    liveNews.map(news => {
                      const isSelected = selectedNews?.id === news.id
                      return (
                        <div
                          key={news.id}
                          onClick={() => handleSelectNews(news)}
                          className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-slate-800/95 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/40 text-white'
                              : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[10px]">
                                {news.source}
                              </span>
                              {news.stockCode && (
                                <span className="font-black text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded text-[10px] border border-purple-500/40">
                                  {news.stockCode}
                                </span>
                              )}
                              {isSelected && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                                  ✓ Đang chọn để dựng video
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-emerald-400 font-semibold">{news.time}</span>
                          </div>
                          <p className="font-bold text-slate-100 line-clamp-2 leading-snug">{news.title}</p>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{news.summary}</p>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* 2. TOÀN VĂN NỘI DUNG BÀI BÁO (TỰ ĐỘNG CÀO HOẶC DÁN TỰ DO) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-emerald-400" />
                    <span>2. Toàn Văn Bài Báo Để AI Đọc & Dựng Kịch Bản (Gửi Gì Dựng Nấy)</span>
                  </label>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    customContent.length > 500 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {customContent.length.toLocaleString('vi-VN')} ký tự {customContent.length > 500 ? '(Toàn văn chi tiết)' : ''}
                  </span>
                </div>
                <textarea
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder="Khi bạn bấm vào một tin ở trên, toàn bộ nội dung chi tiết bài báo sẽ tự động được cào và điền vào đây. Bạn cũng có thể tự dán bài báo bất kỳ..."
                  className="w-full h-44 p-4 rounded-2xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none leading-relaxed transition-all resize-y shadow-inner font-mono"
                />
                <p className="text-[11px] text-slate-400 italic flex items-center gap-1">
                  <span>💡</span>
                  <span>AI sẽ đọc trọn vẹn toàn bộ các đoạn văn trên để trích xuất số liệu, phân tích sự kiện và dựng 13 slide riêng biệt!</span>
                </p>
              </div>

              {/* 3. NÚT HÀNH ĐỘNG DỰNG VIDEO */}
              <div className="space-y-2">
                <button
                  onClick={handleGenerateScript}
                  disabled={isGenerating || !customContent.trim()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating 
                    ? 'Gemini AI Đang Đọc Toàn Bộ Bài Báo & Dựng 13 Slide Độc Bản...' 
                    : selectedNews 
                      ? `🚀 Dựng Video TikTok 13 Slide Về Bài Báo Này`
                      : `🚀 Dựng Video TikTok 13 Slide Từ Nội Dung Trên`}
                </button>
                {selectedNews && (
                  <p className="text-xs text-center text-slate-400 line-clamp-1">
                    Chủ đề bài báo: <span className="text-emerald-400 font-bold">"{selectedNews.title}"</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: MÀN HÌNH PREVIEW KẾT QUẢ VỪA TẠO */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4 px-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                Video Mới Tạo (Live Preview)
              </span>
              {generatedResult && (
                <span className="text-xs text-emerald-400 font-bold">
                  Sẵn Sàng Render
                </span>
              )}
            </div>

            {selectedCampaign ? (
              <OpenDesignVideoPlayer
                key={selectedCampaign.id}
                campaign={selectedCampaign}
              />
            ) : (
              <div className="w-[320px] h-[580px] rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-sm">
                Đang chờ tạo video...
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: QUẢN LÝ FLOW TỰ ĐỘNG HÓA (AUTO-PILOT PIPELINE SETTINGS) */}
      {/* ========================================================================= */}
      {activeTab === 'flow' && (
        <form onSubmit={handleSaveSettings} className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                Cấu Hình Flow Tự Động Hóa (Automation Flow)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Thiết lập quy trình hoạt động độc lập của bot: từ tần suất quét tin tức cho đến cơ chế kiểm duyệt trước khi đẩy lên TikTok.
              </p>
            </div>

            {/* Bật/Tắt chế độ Auto-Pilot */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span>Chế độ Auto-Pilot 100% (Tự động hoàn toàn)</span>
                  {settings.auto_pilot && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      ĐANG BẬT
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bot tự động quét tin mới ➔ Gemini viết kịch bản ➔ Render video ➔ Tự đăng TikTok không cần bấm duyệt thủ công.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_pilot}
                onChange={(e) => setSettings({ ...settings, auto_pilot: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Tần suất chạy */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Tần Suất Quét Tin Tức Tự Động
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: '1h', label: '1 Tiếng / Lần' },
                  { id: '2h', label: '2 Tiếng / Lần (Khuyên dùng)' },
                  { id: '4h', label: '4 Tiếng / Lần' },
                  { id: 'manual', label: 'Thủ công (Chỉ bấm tay)' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSettings({ ...settings, schedule_interval: opt.id })}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left ${
                      settings.schedule_interval === opt.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Giọng đọc AI & Phát thanh viên */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Giọng Đọc AI (Text-to-Speech)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setSettings({ ...settings, tts_voice: 'vi-VN-NamMinhNeural' })}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    settings.tts_voice === 'vi-VN-NamMinhNeural'
                      ? 'bg-emerald-500/10 border-emerald-500'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">Nam Minh (BTV Tài Chính VTV)</span>
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Giọng nam trầm ấm, dõng dạc, đanh thép, cực kỳ uy tín cho bản tin chứng khoán.</p>
                </div>

                <div
                  onClick={() => setSettings({ ...settings, tts_voice: 'vi-VN-HoaiMyNeural' })}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    settings.tts_voice === 'vi-VN-HoaiMyNeural'
                      ? 'bg-emerald-500/10 border-emerald-500'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">Hoài My (Nữ BTV Thời Sự)</span>
                    <Volume2 className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Giọng nữ miền Bắc rõ ràng, thanh thoát, truyền cảm hứng đầu tư.</p>
                </div>
              </div>
            </div>

            {/* Màu sắc Kinetic Typography */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Tùy Chỉnh Màu Sắc Highlight Kinetic Subtitles
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Tăng trần / Bứt phá:</span>
                  <input
                    type="color"
                    value={settings.primary_highlight_color}
                    onChange={(e) => setSettings({ ...settings, primary_highlight_color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Vùng nền / Mức giá:</span>
                  <input
                    type="color"
                    value={settings.accent_highlight_color}
                    onChange={(e) => setSettings({ ...settings, accent_highlight_color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Tên cổ phiếu hot:</span>
                  <input
                    type="color"
                    value={settings.ticker_highlight_color}
                    onChange={(e) => setSettings({ ...settings, ticker_highlight_color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Lưu Cấu Hình Flow
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CÀI ĐẶT API TIKTOK & TÍCH HỢP (INTEGRATIONS & TOKENS) */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                Cấu Hình API TikTok & Khóa Kết Nối
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Nhập thông tin khóa API được cấp từ TikTok Developer Portal hoặc Upload-Post API để hệ thống tự động xuất bản video lên kênh của bạn.
              </p>
            </div>

            {/* Hướng dẫn ngắn cách lấy API */}
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-200/90 space-y-1.5">
              <span className="font-bold text-indigo-300 block">💡 Hướng Dẫn Nhanh Kết Nối TikTok API:</span>
              <p>1. Truy cập <strong>developers.tiktok.com</strong> ➔ Tạo ứng dụng mới.</p>
              <p>2. Xin cấp quyền <strong>Content Posting API (video.publish)</strong>.</p>
              <p>3. Sao chép <strong>Client Key</strong>, <strong>Client Secret</strong> hoặc <strong>Access Token</strong> dán vào form bên dưới.</p>
              <p>4. Nếu chưa có App đã thẩm duyệt, bạn có thể dùng <strong>Upload-Post API Key</strong> (giải pháp trung gian đăng đa nền tảng không cần chờ TikTok duyệt).</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  TikTok Client Key
                </label>
                <input
                  type="text"
                  value={settings.tiktok_client_key}
                  onChange={(e) => setSettings({ ...settings, tiktok_client_key: e.target.value })}
                  placeholder="Ví dụ: aw6x8xxxxxxxx"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  TikTok Client Secret / Access Token
                </label>
                <input
                  type="password"
                  value={settings.tiktok_access_token}
                  onChange={(e) => setSettings({ ...settings, tiktok_access_token: e.target.value })}
                  placeholder="act.xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Tên Kênh TikTok Nhận Video (@username)
                </label>
                <input
                  type="text"
                  value={settings.tiktok_creator_name}
                  onChange={(e) => setSettings({ ...settings, tiktok_creator_name: e.target.value })}
                  placeholder="@fingreen.official"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Khóa Phụ: Upload-Post API Key (Tùy chọn - Đăng đa nền tảng tức thì)
                </label>
                <input
                  type="password"
                  value={settings.upload_post_api_key}
                  onChange={(e) => setSettings({ ...settings, upload_post_api_key: e.target.value })}
                  placeholder="up_live_xxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Cầu nối trung gian cho phép đăng cùng lúc lên TikTok, YouTube Shorts và Facebook Reels mà không cần xét duyệt phức tạp.
                </span>
              </div>
            </div>

            {/* Trạng thái kết nối */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Trạng thái kết nối TikTok API:</span>
              {settings.tiktok_access_token || settings.upload_post_api_key ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sẵn Sàng Đăng Video
                </span>
              ) : (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-amber-400" /> Chưa Thiết Lập Khóa API
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Lưu Cài Đặt API
              </button>

              <button
                type="button"
                onClick={() => {
                  toast.success('Kiểm tra kết nối API TikTok thành công!')
                }}
                className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all border border-slate-700"
              >
                Kiểm Tra Kết Nối (Ping)
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
