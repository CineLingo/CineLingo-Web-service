'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import HomeButton from '@/components/home-button'

export default function TTSResultRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const ttsId = params.tts_id as string

  useEffect(() => {
    // 새로운 URL 구조로 리다이렉트
    router.replace(`/user/results/${ttsId}`)
  }, [ttsId, router])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-8">
        <HomeButton variant="floating" />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">페이지를 이동하고 있습니다...</p>
        </div>
      </div>
    </div>
  )
}
