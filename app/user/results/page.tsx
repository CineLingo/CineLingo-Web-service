'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, Eye, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import HomeButton from '@/components/home-button'
import AudioPlayer from '@/components/AudioPlayer'

type TTSRequestRow = {
  tts_id: string
  reference_audio_url: string | null
  gen_text: string
  status: 'success' | 'fail' | 'pending' | 'in_progress' | string
  public_url: string | null
  created_at: string
}

export default function UserResultsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [rows, setRows] = useState<TTSRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [showTextModal, setShowTextModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClient()

  // 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    fetchUser()
  }, [supabase])

  // user_id로 모든 TTS 요청 불러오기
  const fetchRows = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('tts_requests')
      .select('tts_id, reference_audio_url, gen_text, status, public_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setRows((data as TTSRequestRow[]) || [])
    setLoading(false)
    setRefreshing(false)
  }, [userId, supabase])

  useEffect(() => {
    fetchRows()
  }, [userId, supabase, fetchRows])

  // 새로고침 함수
  const handleRefresh = () => {
    setRefreshing(true)
    fetchRows()
  }

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
          icon: <CheckCircle className="w-4 h-4 text-blue-500" />,
          color: 'text-blue-600 dark:text-blue-400',
          text: '완료'
        }
      case 'fail':
        return {
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          color: 'text-red-600 dark:text-red-400',
          text: '실패'
        }
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4 text-yellow-500" />,
          color: 'text-yellow-600 dark:text-yellow-400',
          text: '대기중'
        }
      case 'in_progress':
        return {
          icon: <AlertCircle className="w-4 h-4 text-blue-500" />,
          color: 'text-blue-600 dark:text-blue-400',
          text: '처리중'
        }
      default:
        return {
          icon: <AlertCircle className="w-4 h-4 text-gray-500" />,
          color: 'text-gray-600 dark:text-gray-400',
          text: status
        }
    }
  }

  // 날짜 포맷팅 (간결하게)
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
        const minute = date.getMinutes()
        return `오늘 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      } else {
        return `${diffInHours}시간 전`
      }
    } else if (diffInDays === 1) {
      const hour = date.getHours()
      const minute = date.getMinutes()
      return `어제 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`
    } else {
      // 7일 이상 지난 경우 간결한 형식
      return date.toLocaleDateString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // 화면 크기 상태
  const [isMobile, setIsMobile] = useState(false)

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // 텍스트 줄임 처리
  const truncateText = (text: string, maxLines: number = 2) => {
    const words = text.split(' ')
    const maxWords = maxLines * 8 // 한 줄당 약 8단어
    if (words.length <= maxWords) return text
    return words.slice(0, maxWords).join(' ') + '...'
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto mt-4 sm:mt-8 p-4 sm:p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 dark:border-gray-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
      </div>
    </div>
  )

  if (!rows.length) return (
    <div className="max-w-4xl mx-auto mt-4 sm:mt-8 p-4 sm:p-8">
      <HomeButton variant="floating" />
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">보이스북</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">아직 TTS 요청이 없습니다.</p>
        <Link 
          href="/upload" 
          className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 text-sm sm:text-base"
        >
          첫 번째 TTS 요청하기
        </Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto mt-4 sm:mt-8 p-4 sm:p-8">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-4">
          <HomeButton variant="minimal" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">보이스북</h1>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="새로고침"
        >
          <RefreshCw 
            size={16} 
            className={`${refreshing ? 'animate-spin' : ''}`} 
          />
          <span className="hidden sm:inline text-sm">새로고침</span>
        </button>
      </div>
      
      <div className="grid gap-3 sm:gap-4">
                 {rows.map((row, i) => {
           const statusInfo = getStatusInfo(row.status)
           
           return (
             <div 
               key={row.tts_id} 
               className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800"
             >
              {/* 요청 시간 */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {formatDate(row.created_at)}
              </div>

              {/* 요청한 텍스트 */}
              <div className="mb-3 sm:mb-4">
                <p 
                  className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  onClick={() => {
                    setSelectedText(row.gen_text)
                    setShowTextModal(true)
                  }}
                >
                  {truncateText(row.gen_text, isMobile ? 1 : 2)}
                </p>
              </div>

              {/* 플레이 바 & 재생시간 */}
              <div className="mb-3 sm:mb-4">
                                 {row.public_url ? (
                   <div className="w-full">
                     <AudioPlayer 
                       audioUrl={row.public_url} 
                       width={isMobile ? 350 : 400} 
                       height={isMobile ? 60 : 50}
                     />
                   </div>
                 ) : (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                    {statusInfo.icon}
                    <span className={statusInfo.color}>{statusInfo.text}</span>
                  </div>
                )}
              </div>

              {/* 버튼 영역 */}
              <div className="flex items-center justify-between gap-2">
                {row.status === 'success' && row.public_url ? (
                  <button
                    onClick={() => handleDownload(row.public_url!, `tts-generated-${i + 1}.mp3`)}
                    className="flex-1 h-12 sm:h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm rounded-lg transition-colors"
                    title="음성 파일 다운로드"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">다운로드</span>
                    <span className="sm:hidden">다운</span>
                  </button>
                ) : (
                  <div className={`flex-1 h-12 sm:h-11 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg ${statusInfo.color}`}>
                    {statusInfo.icon}
                    <span className="hidden sm:inline">{statusInfo.text}</span>
                    <span className="sm:hidden">{statusInfo.text}</span>
                  </div>
                )}
                
                <Link
                  href={`/user/results/${row.tts_id}`}
                  className="h-12 w-12 sm:h-11 sm:w-11 flex items-center justify-center bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 rounded-lg transition-colors"
                  title="상세 보기"
                >
                  <Eye size={18} />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* 텍스트 모달 */}
      {showTextModal && selectedText && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTextModal(false)
            }
          }}
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">입력 텍스트</h3>
                <button
                  onClick={() => setShowTextModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded-lg">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                  {selectedText}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 