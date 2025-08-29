'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import HomeButton from '@/components/home-button'
import { NavTheme } from '@/components/nav-theme'
import dynamic from 'next/dynamic'
import ShareButton from '@/components/ShareButton'
import ShareRefButton from '@/components/ShareRefButton'

type TTSRequestDetail = {
  request_id: string
  user_id: string
  reference_id: string | null
  ref_text_at_request: string
  gen_text_at_request: string
  status: string
  created_at: string
  updated_at: string
  error_log?: string
  ref_audios?: { ref_file_url: string; ref_file_path?: string }[]
  gen_audios?: { 
    gen_file_url: string; 
    gen_file_path: string;
    gen_text?: string;
    gen_duration?: number;
    gen_is_public: boolean;
    gen_shared_title?: string;
    gen_shared_image?: string;
    ref_text_while_gen?: string;
  }[]
}

type FeedbackInitial = {
  rating_overall?: number
  comment?: string
}

export default function TTSResultDetailPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [ttsRequest, setTtsRequest] = useState<TTSRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const params = useParams()
  const ttsId = params.tts_id as string
  const FeedbackSheet = useMemo(
    () => dynamic(() => import('@/components/feedback/FeedbackSheet'), { ssr: false }),
    []
  )
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackState, setFeedbackState] = useState<{ exists: boolean; id?: string; initial?: FeedbackInitial } | null>(null)

  // 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    fetchUser()
  }, [supabase])

  const fetchTTSRequest = useCallback(async () => {
    if (!userId || !ttsId) return
    
    const { data, error } = await supabase
      .from('tts_requests')
      .select(`
        request_id, 
        user_id, 
        reference_id, 
        ref_text_at_request,
        gen_text_at_request,
        status, 
        created_at, 
        updated_at, 
        error_log,
        gen_audios(gen_file_url, gen_file_path, gen_text, gen_duration, gen_is_public, gen_shared_title, gen_shared_image, ref_text_while_gen)
      `)
      .eq('request_id', ttsId)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching TTS request:', error)
      setError('TTS 요청을 찾을 수 없습니다.')
      setLoading(false)
      return
    }
    if (!data) {
      setError('TTS 요청을 찾을 수 없습니다.')
      setLoading(false)
      return
    }
    
    // 참조 오디오 별도로 가져오기
    let refAudioData = null;
    if (data.reference_id) {
      const { data: refAudio } = await supabase
        .from('ref_audios')
        .select('ref_file_url, ref_file_path')
        .eq('ref_id', data.reference_id)
        .single()
      refAudioData = refAudio ? [refAudio] : null;
    }
    
    setTtsRequest({ 
      ...data, 
      ref_audios: refAudioData 
    } as TTSRequestDetail)
    setLoading(false)
  }, [userId, ttsId, supabase])

  // 특정 TTS 요청 불러오기
  useEffect(() => {
    fetchTTSRequest()
  }, [fetchTTSRequest])
  // 피드백 존재 여부 조회 함수 및 초기 조회
  const fetchFeedbackState = useCallback(async () => {
    try {
      if (!ttsId) return
      const sessionId = ((): string => {
        const key = 'feedback_session_id'
        let sid = localStorage.getItem(key)
        if (!sid) { sid = crypto.randomUUID(); localStorage.setItem(key, sid) }
        return sid
      })()
      const res = await fetch(`/api/feedback?tts_id=${encodeURIComponent(ttsId)}&session_id=${encodeURIComponent(sessionId)}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.exists) {
        setFeedbackState({ exists: true, id: data.feedback.id, initial: { rating_overall: data.feedback.rating_overall, comment: data.feedback.comment } })
      } else {
        setFeedbackState({ exists: false })
      }
    } catch {}
  }, [ttsId])

  useEffect(() => {
    fetchFeedbackState()
  }, [fetchFeedbackState])


  // 자동 새로고침
  useEffect(() => {
    if (!userId || !ttsId) return
    const channel = supabase
      .channel(`tts-request-detail-${ttsId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tts_requests', filter: `request_id=eq.${ttsId}` }, () => {
        fetchTTSRequest()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, ttsId, supabase, fetchTTSRequest])

  // 다운로드 함수
  const handleDownload = async (url: string, filename?: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'tts-generated-audio.mp3'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('다운로드 중 오류 발생:', error)
      alert('다운로드에 실패했습니다.')
    }
  }

  // 상태에 따른 아이콘과 색상
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          text: '완료'
        }
      case 'fail':
        return {
          icon: <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          text: '실패'
        }
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />,
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          text: '대기중'
        }
      case 'in_progress':
        return {
          icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          text: '생성중'
        }
      default:
        return {
          icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          text: status
        }
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    // 같은 날인지 확인
    const isToday = date.toDateString() === now.toDateString()

    if (diffInMinutes < 1) {
      return '방금 전'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`
    } else if (diffInHours < 24) {
      if (isToday) {
        const hour = date.getHours()
        const ampm = hour < 12 ? '오전' : '오후'
        const displayHour = hour < 12 ? hour : hour - 12
        return `오늘 ${ampm} ${displayHour}시`
      } else {
        return `${diffInHours}시간 전`
      }
    } else if (diffInDays === 1) {
      const hour = date.getHours()
      const ampm = hour < 12 ? '오전' : '오후'
      const displayHour = hour < 12 ? hour : hour - 12
      return `어제 ${ampm} ${displayHour}시`
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`
    } else {
      // 7일 이상 지난 경우 원래 형식 사용
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <HomeButton variant="floating" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm sm:text-base">로딩 중...</p>
          </div>
        </div>
      </div>
    </div>
  )

  if (error || !ttsRequest) return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <HomeButton variant="floating" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">오류</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">{error || 'TTS 요청을 찾을 수 없습니다.'}</p>
            <Link 
              href="/user/results" 
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 text-sm sm:text-base font-medium"
            >
              결과 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

  const statusInfo = getStatusInfo(ttsRequest.status)
  const refText = ttsRequest.gen_audios?.[0]?.ref_text_while_gen ?? ttsRequest.ref_text_at_request
  const isPresetRef = ttsRequest.ref_audios?.[0]?.ref_file_path?.toLowerCase().startsWith('preset_audio/') === true

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <NavTheme theme="upload" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link 
                href="/user/results"
                className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 dark:hover:from-blue-800/30 dark:hover:to-purple-800/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg transition-all duration-300 text-sm"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">목록</span>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">TTS 요청 상세</h1>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${statusInfo.bgColor}`}>
              {statusInfo.icon}
              <span className={`font-semibold text-sm ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
            </div>
          </div>
        </div>

        {/* 생성 시간 */}
        <div className="px-4 sm:px-6 pb-2 sm:pb-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(ttsRequest.created_at)}
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* 생성된 음성 */}
          <div className="p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">생성된 음성</h2>
            {ttsRequest.gen_audios && ttsRequest.gen_audios.length > 0 ? (
              <div className="space-y-4">
                <div className="w-full">
                  <audio 
                    controls 
                    src={ttsRequest.gen_audios[0].gen_file_url} 
                    className="w-full h-12 sm:h-14"
                    preload="metadata"
                  />
                </div>
                
                {/* 생성된 음성 정보 */}
                {ttsRequest.gen_audios[0].gen_shared_title && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        공유 제목
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {ttsRequest.gen_audios[0].gen_shared_title}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                  {ttsRequest.status === 'success' ? '음성이 생성되었지만 파일을 찾을 수 없습니다.' : '아직 음성이 생성되지 않았습니다.'}
                </p>
              </div>
            )}
          </div>

          {/* 생성된 음성의 텍스트 */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
              <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                {ttsRequest.gen_text_at_request}
              </p>
            </div>
            
            {/* 음성 파일 다운로드, 공유하기 */}
            {ttsRequest.gen_audios && ttsRequest.gen_audios.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-row gap-3">
                  <button
                    onClick={() => {
                      const url = ttsRequest.gen_audios?.[0]?.gen_file_url;
                      if (url) {
                        handleDownload(url, `tts-generated-${ttsRequest.request_id}.mp3`);
                      } else {
                        alert('음성 파일 URL을 찾을 수 없습니다.');
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 text-sm font-medium touch-manipulation"
                  >
                    <Download size={16} />
                    <span className="sm:hidden">다운로드</span>
                    <span className="hidden sm:inline whitespace-nowrap">음성 파일 다운로드</span>
                  </button>
                  <ShareButton 
                    ttsId={ttsRequest.request_id}
                    text="공유하기"
                    variant="outline"
                    size="md"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-300 text-sm font-medium touch-manipulation"
                  />
                </div>
              </div>
            )}
            {/* 피드백 CTA (생성된 음성 블럭 하단, 중립 색상) */}
            <div className="mt-3">
              <button
                onClick={() => setShowFeedback(true)}
                className="w-full h-12 sm:h-12 rounded-lg border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm sm:text-base font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <MessageSquare size={16} />
                  {feedbackState?.exists ? '피드백 수정하기' : '피드백 남기기'}
                </span>
              </button>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-b border-gray-200 dark:border-gray-700"></div>

          {/* 참조 음성 */}
          {ttsRequest.ref_audios && ttsRequest.ref_audios.length > 0 && (
            <div className="p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">내 음성 (참조 음성)</h2>
              <div className="w-full">
                <audio 
                  controls 
                  src={ttsRequest.ref_audios[0].ref_file_url} 
                  className="w-full h-12 sm:h-14"
                  preload="metadata"
                />
              </div>
            </div>
          )}

          

          {/* 참조 음성 텍스트 */}
          {refText && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {refText}
                </p>
              </div>
              
              {/* 참조 음성 공유 버튼 */}
              {ttsRequest.reference_id && !isPresetRef && (
                <div className="mt-4 flex items-center justify-center">
                  <ShareRefButton
                    refId={ttsRequest.reference_id}
                    text="참조 음성 공유"
                    variant="default"
                    size="md"
                    className="w-full h-12 sm:h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-sm rounded-lg transition-colors"
                  />
                </div>
              )}
            </div>
          )}

          {/* 오류 로그 */}
          {ttsRequest.error_log && (
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle size={20} />
                오류 로그
              </h2>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 rounded-lg">
                <div className="mb-3">
                  <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-2">
                    상세 오류 정보
                  </label>
                  <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded p-3">
                    <pre className="text-red-700 dark:text-red-300 text-xs leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
                      {ttsRequest.error_log}
                    </pre>
                  </div>
                </div>
                <div className="text-xs text-red-600 dark:text-red-400">
                  <p>💡 이 오류 정보는 문제 해결을 위해 개발팀에 전달됩니다.</p>
                </div>
              </div>
            </div>
          )}


        </div>

        {/* 피드백 시트 */}
        <FeedbackSheet
          ttsId={ttsRequest.request_id}
          open={showFeedback}
          onClose={() => setShowFeedback(false)}
          onSubmitted={() => {
            try {
              const key = 'feedback_submitted_tts_ids'
              const arr = JSON.parse(localStorage.getItem(key) || '[]') as string[]
              if (!arr.includes(ttsRequest.request_id)) {
                arr.push(ttsRequest.request_id)
                localStorage.setItem(key, JSON.stringify(arr))
              }
            } catch {}
            fetchFeedbackState()
          }}
          mode={feedbackState?.exists ? 'edit' : 'create'}
          initial={feedbackState?.exists ? { id: feedbackState.id, ...feedbackState.initial } : undefined}
        />

        
      </div>
    </div>
  )
} 