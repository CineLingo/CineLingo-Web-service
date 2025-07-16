<<<<<<< HEAD
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download } from 'lucide-react'

export default function TTSResultPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
  useEffect(() => {
    if (!userId) return
    const fetchRows = async () => {
      const { data, error } = await supabase
        .from('tts_requests')
        .select('reference_audio_url, gen_text, status, public_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      console.log('Fetched TTS requests:', data) // 디버깅용 로그
      setRows(data || [])
      setLoading(false)
    }
    fetchRows()
  }, [userId, supabase])

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

  if (loading) return <div>Loading...</div>
  if (!rows.length) return <div>결과가 없습니다.</div>

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">나의 TTS 요청 결과</h1>
      
      <table className="w-full border-collapse rounded-lg overflow-hidden shadow">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-800">
            <th className="p-3 text-left text-gray-800 dark:text-gray-200">업로드 파일</th>
            <th className="p-3 text-left text-gray-800 dark:text-gray-200">입력 텍스트</th>
            <th className="p-3 text-left text-gray-800 dark:text-gray-200">상태</th>
            <th className="p-3 text-left text-gray-800 dark:text-gray-200">생성 음성</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <td className="p-3">
                {row.reference_audio_url ? (
                  <audio controls src={row.reference_audio_url} className="w-40" />
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">없음</span>
                )}
              </td>
              <td className="p-3 text-gray-900 dark:text-gray-100">{row.gen_text}</td>
              <td className="p-3">
                <span className={
                  row.status === 'success'
                    ? 'text-green-600 dark:text-green-400 font-semibold'
                    : row.status === 'fail'
                    ? 'text-red-600 dark:text-red-400 font-semibold'
                    : 'text-yellow-600 dark:text-yellow-400 font-semibold'
                }>
                  {row.status}
                </span>
              </td>
              <td className="p-3">
                {row.public_url ? (
                  <div className="flex items-center gap-2">
                    <audio controls src={row.public_url} className="w-40" />
                    <button
                      onClick={() => handleDownload(row.public_url, `tts-generated-${i + 1}.mp3`)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                      title="음성 파일 다운로드"
                    >
                      <Download size={14} />
                      다운로드
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">미생성</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
=======
'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download } from 'lucide-react'

type TTSRequestRow = {
  reference_audio_url: string | null
  gen_text: string
  status: 'success' | 'fail' | string
  generated_audio_url: string | null
}

export default function TTSResultPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [rows, setRows] = useState<TTSRequestRow[]>([])
  const [loading, setLoading] = useState(true)
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
  useEffect(() => {
    if (!userId) return
    const fetchRows = async () => {
      const { data } = await supabase
        .from('tts_requests')
        .select('reference_audio_url, gen_text, status, generated_audio_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setRows((data as TTSRequestRow[]) || [])
      setLoading(false)
    }
    fetchRows()
  }, [userId, supabase])

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

  if (loading) return <div>Loading...</div>
  if (!rows.length) return <div>결과가 없습니다.</div>

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">나의 TTS 요청 결과</h1>
      <table className="w-full border-collapse rounded-lg overflow-hidden shadow">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-800">
            <th className="p-3 text-left text-gray-800 dark:text-gray-200">업로드 파일</th>
            <th className="p-3 text-left text-gray-800 dark:text-gray-200">입력 텍스트</th>
            <th className="p-3 text-left text-gray-800 dark:text-gray-200">상태</th>
            <th className="p-3 text-left text-gray-800 dark:text-gray-200">생성 음성</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <td className="p-3">
                {row.reference_audio_url ? (
                  <audio controls src={row.reference_audio_url} className="w-40" />
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">없음</span>
                )}
              </td>
              <td className="p-3 text-gray-900 dark:text-gray-100">{row.gen_text}</td>
              <td className="p-3">
                <span className={
                  row.status === 'success'
                    ? 'text-green-600 dark:text-green-400 font-semibold'
                    : row.status === 'fail'
                    ? 'text-red-600 dark:text-red-400 font-semibold'
                    : 'text-yellow-600 dark:text-yellow-400 font-semibold'
                }>
                  {row.status}
                </span>
              </td>
              <td className="p-3">
                {row.generated_audio_url ? (
                  <div className="flex items-center gap-2">
                    <audio controls src={row.generated_audio_url} className="w-40" />
                    <button
                      onClick={() => handleDownload(row.generated_audio_url!, `tts-generated-${i + 1}.mp3`)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                      title="음성 파일 다운로드"
                    >
                      <Download size={14} />
                      다운로드
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">미생성</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
>>>>>>> e60778fc0a9a72442bfebae663d65e9c9c3a1a83
