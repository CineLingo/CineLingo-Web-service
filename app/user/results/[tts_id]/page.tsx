'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import HomeButton from '@/components/home-button'

type TTSRequestDetail = {
  tts_id: string
  user_id: string
  reference_audio_url: string | null
  gen_text: string
  status: 'success' | 'fail' | 'pending' | 'in_progress' | string
  public_url: string | null
  created_at: string
  error_message?: string
}

export default function TTSResultDetailPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [ttsRequest, setTtsRequest] = useState<TTSRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const params = useParams()
  const ttsId = params.tts_id as string

  // 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    fetchUser()
  }, [supabase])

  // 특정 TTS 요청 불러오기
  useEffect(() => {
    if (!userId || !ttsId) return
    
    const fetchTTSRequest = async () => {
      const { data, error } = await supabase
        .from('tts_requests')
        .select('*')
        .eq('tts_id', ttsId)
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

      setTtsRequest(data as TTSRequestDetail)
      setLoading(false)
    }

    fetchTTSRequest()
  }, [userId, ttsId, supabase])

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
      case 'success':
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <HomeButton variant="floating" />
        
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
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
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${statusInfo.bgColor} self-start sm:self-auto`}>
            {statusInfo.icon}
            <span className={`font-semibold text-sm ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* 요청 정보 */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">요청 정보</h2>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  요청 시간
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(ttsRequest.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* 입력 텍스트 */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">입력 텍스트</h2>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
              <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                {ttsRequest.gen_text}
              </p>
            </div>
          </div>

          {/* 참조 오디오 */}
          {ttsRequest.reference_audio_url && (
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">참조 오디오</h2>
              <div className="w-full">
                <audio 
                  controls 
                  src={ttsRequest.reference_audio_url} 
                  className="w-full h-12 sm:h-14"
                  preload="metadata"
                />
              </div>
            </div>
          )}

          {/* 생성된 음성 */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">생성된 음성</h2>
            {ttsRequest.public_url ? (
              <div className="space-y-4">
                <div className="w-full">
                  <audio 
                    controls 
                    src={ttsRequest.public_url} 
                    className="w-full h-12 sm:h-14"
                    preload="metadata"
                  />
                </div>
                <button
                  onClick={() => handleDownload(ttsRequest.public_url!, `tts-generated-${ttsRequest.tts_id}.mp3`)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 text-sm font-medium touch-manipulation"
                >
                  <Download size={16} />
                  음성 파일 다운로드
                </button>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                  {ttsRequest.status === 'success' ? '음성이 생성되었지만 파일을 찾을 수 없습니다.' : '아직 음성이 생성되지 않았습니다.'}
                </p>
              </div>
            )}
          </div>

          {/* 오류 메시지 */}
          {ttsRequest.error_message && (
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-red-600 dark:text-red-400">오류 정보</h2>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 rounded-lg">
                <p className="text-red-700 dark:text-red-300 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                  {ttsRequest.error_message}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 