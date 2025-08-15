'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Play, Pause, Volume2, Share2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import HomeButton from '@/components/home-button'

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
  ref_audios?: { ref_file_url: string }[]
  gen_audios?: { 
    gen_file_url: string; 
    gen_file_path: string;
    gen_text?: string;
    gen_duration?: number;
    gen_is_public: boolean;
    gen_shared_title?: string;
    gen_shared_image?: string;
  }[]
}

export default function SharePage() {
  const [ttsRequest, setTtsRequest] = useState<TTSRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const supabase = createClient()
  const params = useParams()
  const ttsId = params.tts_id as string

  // 특정 TTS 요청 불러오기 (공개 접근)
  useEffect(() => {
    if (!ttsId) return
    
        const fetchTTSRequest = async () => {
              try {
        // 먼저 TTS 요청 정보 가져오기
        const { data: ttsData, error: ttsError } = await supabase
          .from('tts_requests')
          .select('request_id, user_id, reference_id, ref_text_at_request, gen_text_at_request, created_at, waited_time, status, updated_at, error_log')
          .eq('request_id', ttsId)
          .single()

        if (ttsError) {
          console.error('Error fetching TTS request:', ttsError)
          console.error('Error details:', {
            message: ttsError.message,
            details: ttsError.details,
            hint: ttsError.hint,
            code: ttsError.code
          })
          console.error('Full error object:', JSON.stringify(ttsError, null, 2))
          setError('공유된 TTS 결과를 찾을 수 없습니다.')
          setLoading(false)
          return
        }

        if (!ttsData) {
          setError('공유된 TTS 결과를 찾을 수 없습니다.')
          setLoading(false)
          return
        }

        // 생성된 오디오 가져오기
        const { data: genAudioData, error: genAudioError } = await supabase
          .from('gen_audios')
          .select('gen_file_url, gen_file_path, gen_text, gen_duration, gen_is_public, gen_shared_title, gen_shared_image')
          .eq('request_id', ttsData.request_id)
          .limit(1)

        if (genAudioError) {
          console.error('Error fetching gen audio:', genAudioError)
        }

        // 참조 오디오 가져오기
        let refAudioData = null
        if (ttsData.reference_id) {
          const { data: refAudio, error: refAudioError } = await supabase
            .from('ref_audios')
            .select('ref_file_url, ref_text, ref_duration')
            .eq('ref_id', ttsData.reference_id)
            .single()
          
          if (refAudioError) {
            console.error('Error fetching ref audio:', refAudioError)
          } else {
            refAudioData = refAudio ? [refAudio] : null
          }
        }

        const processedData = {
          request_id: ttsData.request_id,
          user_id: ttsData.user_id || '', 
          reference_id: ttsData.reference_id,
          ref_text_at_request: ttsData.ref_text_at_request,
          gen_text_at_request: ttsData.gen_text_at_request,
          status: ttsData.status,
          created_at: ttsData.created_at,
          updated_at: ttsData.updated_at || ttsData.created_at,
          error_log: ttsData.error_log,
          ref_audios: refAudioData || [],
          gen_audios: genAudioData || []
        }

        setTtsRequest(processedData as TTSRequestDetail)
        setLoading(false)
        
      } catch (error) {
        console.error('Unexpected error in fetchTTSRequest:', error)
        setError('예상치 못한 오류가 발생했습니다.')
        setLoading(false)
      }
    }

    fetchTTSRequest()
  }, [ttsId, supabase])

  // 오디오 플레이어 설정
  useEffect(() => {
    if (ttsRequest?.gen_audios && ttsRequest.gen_audios.length > 0) {
      const audio = new Audio(ttsRequest.gen_audios[0].gen_file_url)
      
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
      })
      
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime)
      })
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        setCurrentTime(0)
      })
      
      setAudioElement(audio)
      
      return () => {
        audio.pause()
        audio.removeEventListener('loadedmetadata', () => {})
        audio.removeEventListener('timeupdate', () => {})
        audio.removeEventListener('ended', () => {})
      }
    }
  }, [ttsRequest?.gen_audios])

  // 재생/일시정지 토글
  const togglePlay = () => {
    if (!audioElement) return
    
    if (isPlaying) {
      audioElement.pause()
    } else {
      audioElement.play()
    }
    setIsPlaying(!isPlaying)
  }

  // 진행률 표시
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 공유 기능
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/${ttsId}`
    const shareText = `내가 만든 TTS 음성 들어보세요! "${ttsRequest?.gen_text_at_request.slice(0, 50)}..."`

    if (navigator.share) {
      // 네이티브 공유 API 사용 (모바일)
      try {
        await navigator.share({
          title: 'Lingo Voice TTS',
          text: shareText,
          url: shareUrl,
        })
      } catch {
        console.log('공유가 취소되었습니다.')
      }
    } else {
      // 데스크톱에서는 모달 표시
      setShowShareModal(true)
    }
  }

  // 클립보드에 링크 복사
  const copyToClipboard = async () => {
    const shareUrl = `${window.location.origin}/share/${ttsId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('링크가 클립보드에 복사되었습니다!')
      setShowShareModal(false)
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
      alert('링크 복사에 실패했습니다.')
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
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
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">{error || '공유된 TTS 결과를 찾을 수 없습니다.'}</p>
            <Link 
              href="/" 
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 text-sm sm:text-base font-medium"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <HomeButton variant="floating" />
        
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 dark:hover:from-blue-800/30 dark:hover:to-purple-800/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg transition-all duration-300 text-sm"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">홈</span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">공유된 TTS 음성</h1>
          </div>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 text-sm font-medium"
          >
            <Share2 size={16} />
            공유하기
          </button>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* 요청 정보 */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">생성 정보</h2>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  생성 시간
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(ttsRequest.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* 변환할 텍스트 */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">생성된 음성의 텍스트</h2>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
              <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                {ttsRequest.gen_text_at_request}
              </p>
            </div>
          </div>

          {/* 생성된 음성 */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">생성된 음성</h2>
            {ttsRequest.gen_audios && ttsRequest.gen_audios.length > 0 ? (
              <div className="space-y-4">
                {/* 커스텀 오디오 플레이어 */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full flex items-center justify-center transition-all duration-300"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Volume2 size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Lingo Voice TTS</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                    </div>
                  </div>
                  
                  {/* 진행률 바 */}
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                {ttsRequest.status === 'fail' || ttsRequest.status === 'failed' ? (
                  <div className="space-y-3">
                    <p className="text-red-600 dark:text-red-400 text-sm sm:text-base font-medium">
                      음성 생성에 실패했습니다.
                    </p>
                    {ttsRequest.error_log && (
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        <p className="text-red-700 dark:text-red-300 text-xs leading-relaxed whitespace-pre-wrap">
                          {ttsRequest.error_log}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                    음성 파일을 찾을 수 없습니다.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* CTA 섹션 */}
          <div className="p-4 sm:p-6">
            <div className="text-center">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                나도 만들어보세요!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">
                나만의 음성으로 TTS를 생성해보세요.
              </p>
              <Link 
                href="/upload"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 text-sm sm:text-base font-medium"
              >
                <ExternalLink size={16} />
                TTS 시작하기
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 공유 모달 */}
      {showShareModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowShareModal(false)
            }
          }}
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">공유하기</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  <Share2 size={16} />
                  링크 복사
                </button>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    모바일에서는 자동으로 공유 옵션이 표시됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 