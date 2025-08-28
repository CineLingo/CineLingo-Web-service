'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Share2, Plus, Mic, User } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import HomeButton from '@/components/home-button'
import { Button } from '@/components/ui/button'
import { NavTheme } from '@/components/nav-theme'

type RefAudioDetail = {
  ref_id: string
  user_id: string
  ref_file_url: string
  ref_file_path?: string
  ref_text?: string
  ref_duration?: number
  created_at: string
  is_public: boolean
  ref_shared_title?: string
  user?: {
    display_name?: string
    email: string
  }
}

export default function ShareRefPage() {
  const [refAudio, setRefAudio] = useState<RefAudioDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)
  const [addingToShared, setAddingToShared] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  const supabase = createClient()
  const params = useParams()
  const refId = params.ref_id as string

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    fetchCurrentUser()
  }, [supabase])

  // 특정 참조 음성 불러오기 (공개 접근)
  useEffect(() => {
    if (!refId) return
    
    const fetchRefAudio = async () => {
      try {
        // 참조 음성 정보 가져오기
        const { data: refData, error: refError } = await supabase
          .from('ref_audios')
          .select(`
            ref_id, 
            user_id, 
            ref_file_url, 
            ref_file_path,
            ref_text, 
            ref_duration, 
            created_at, 
            is_public, 
            ref_shared_title,
            users(display_name, email)
          `)
          .eq('ref_id', refId)
          .single()

        if (refError) {
          console.error('Error fetching ref audio:', refError)
          setError('공유된 참조 음성을 찾을 수 없습니다.')
          setLoading(false)
          return
        }

        if (!refData) {
          setError('공유된 참조 음성을 찾을 수 없습니다.')
          setLoading(false)
          return
        }

        // 공개 여부 확인
        if (!refData.is_public) {
          setError('이 참조 음성은 비공개로 설정되어 있습니다.')
          setLoading(false)
          return
        }

        setRefAudio(refData as RefAudioDetail)
        setLoading(false)
        
      } catch (error) {
        console.error('Unexpected error in fetchRefAudio:', error)
        setError('예상치 못한 오류가 발생했습니다.')
        setLoading(false)
      }
    }

    fetchRefAudio()
  }, [refId, supabase])

  // 오디오 플레이어 설정
  useEffect(() => {
    if (refAudio?.ref_file_url) {
      const audio = new Audio(refAudio.ref_file_url)
      
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
      })
      
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime)
      })
      
      audio.addEventListener('ended', () => {
        setCurrentTime(0)
      })
      
      return () => {
        audio.pause()
        audio.removeEventListener('loadedmetadata', () => {})
        audio.removeEventListener('timeupdate', () => {})
        audio.removeEventListener('ended', () => {})
      }
    }
  }, [refAudio?.ref_file_url])

  // 재생/일시정지 토글 (사용되지 않음 - 제거)

  // 진행률 표시
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 프리셋 여부 판단 (preset_audio/* 경로)
  const isPreset = refAudio?.ref_file_path?.toLowerCase().startsWith('preset_audio/') === true

  // 공유 기능
  const handleShare = async () => {
    if (isPreset) {
      alert('프리셋 참조 음성은 공유할 수 없습니다.')
      return
    }
    const shareUrl = `${window.location.origin}/share/ref/${refId}`
    const shareText = `참조 음성 들어보세요! "${refAudio?.ref_text?.slice(0, 50) || '음성 파일'}..."`

    if (navigator.share) {
      // 네이티브 공유 API 사용 (모바일)
      try {
        await navigator.share({
          title: 'Lingo Voice 참조 음성',
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
    const shareUrl = `${window.location.origin}/share/ref/${refId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('링크가 클립보드에 복사되었습니다!')
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
      alert('링크 복사에 실패했습니다.')
    }
  }

  // 공유 음성에 추가
  const handleAddToShared = async () => {
    if (isPreset) {
      alert('프리셋 참조 음성은 공유 목록에 추가할 수 없습니다.')
      return
    }
    if (!currentUserId || !refAudio) {
      alert('로그인이 필요합니다.')
      return
    }

    if (currentUserId === refAudio.user_id) {
      alert('자신의 참조 음성은 추가할 수 없습니다.')
      return
    }

    setAddingToShared(true)

    try {
      // 이미 추가된 참조 음성인지 확인
      const { data: existingShared, error: checkError } = await supabase
        .from('shared_ref_audios')
        .select('shared_id')
        .eq('ref_id', refId)
        .eq('child_user_id', currentUserId)
        .maybeSingle()

      if (checkError) {
        console.error('중복 확인 오류:', checkError)
        throw new Error('중복 확인 중 오류가 발생했습니다.')
      }

      if (existingShared) {
        alert('이미 추가된 참조 음성입니다.')
        setAddingToShared(false)
        return
      }

      // shared_ref_audios 테이블에 추가
      const insertData = {
        ref_id: refId,
        child_user_id: currentUserId
      }
      
      const { error: insertError } = await supabase
        .from('shared_ref_audios')
        .insert(insertData)
        .select('shared_id, ref_id, child_user_id')

      if (insertError) {
        console.error('공유 음성 추가 오류:', insertError)
        throw new Error(`공유 음성 추가에 실패했습니다: ${insertError.message}`)
      }

      setAddSuccess(true)
      setTimeout(() => setAddSuccess(false), 3000)
      
    } catch (error) {
      console.error('공유 음성 추가 중 오류:', error)
      alert(error instanceof Error ? error.message : '공유 음성 추가에 실패했습니다.')
    } finally {
      setAddingToShared(false)
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">참조 음성을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <HomeButton variant="floating" />
          
          <div className="text-center py-12">
            <div className="mb-6">
              <Mic size={64} className="mx-auto text-gray-400 dark:text-gray-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">참조 음성을 찾을 수 없습니다</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300"
            >
              <ArrowLeft size={16} />
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <NavTheme theme="upload" />
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">공유된 참조 음성</h1>
          </div>
          {!isPreset && (
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg transition-all duration-300 text-sm font-medium"
            >
              <Share2 size={16} />
              공유하기
            </button>
          )}
        </div>

        {/* 메인 컨텐츠 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 sm:p-8">
          {/* 사용자 정보 */}
          {refAudio?.user && (
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {refAudio.user.display_name || '익명 사용자'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {refAudio.user.email}
                </p>
              </div>
            </div>
          )}

          {/* 참조 텍스트 */}
          <div className="mb-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">참조 음성의 텍스트</h2>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-relaxed">
                {refAudio?.ref_text || '참조 텍스트가 없습니다.'}
              </p>
            </div>
          </div>

          {/* 참조 음성 플레이어 */}
          <div className="mb-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">참조 음성</h2>
            {refAudio?.ref_file_url ? (
              <div className="space-y-4">
                <div className="w-full">
                  <audio 
                    controls 
                    src={refAudio.ref_file_url} 
                    className="w-full h-12 sm:h-14"
                    preload="metadata"
                  />
                </div>
                
                {/* 재생 정보 */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>재생 시간: {formatTime(currentTime)} / {formatTime(duration)}</span>
                  {refAudio.ref_duration && (
                    <span>총 길이: {formatTime(refAudio.ref_duration)}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Mic size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">음성 파일을 찾을 수 없습니다.</p>
              </div>
            )}
          </div>

          {/* 공유 음성에 추가 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3">
            {currentUserId && currentUserId !== refAudio?.user_id && !isPreset ? (
              <button
                onClick={handleAddToShared}
                disabled={addingToShared || addSuccess}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-green-400 disabled:to-teal-400 text-white rounded-lg transition-all duration-300 text-sm font-medium disabled:cursor-not-allowed"
              >
                {addingToShared ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    추가 중...
                  </>
                ) : addSuccess ? (
                  <>
                    <Plus size={16} />
                    추가 완료!
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    공유 음성에 추가
                  </>
                )}
              </button>
            ) : !currentUserId ? (
              <Link
                href="/auth/login"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 text-sm font-medium"
              >
                로그인하여 추가하기
              </Link>
            ) : null}
            
            <Button 
              asChild 
              className="flex-1 sm:flex-none h-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-white text-sm sm:text-base font-medium"
            >
              <Link href="/upload">TTS 생성하기</Link>
            </Button>
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
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">참조 음성 공유하기</h3>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">공유 링크</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/share/ref/${refId}`}
                      readOnly
                      className="flex-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                    >
                      복사
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    이 링크를 통해 다른 사용자가 참조 음성을 사용할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 