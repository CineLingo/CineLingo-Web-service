'use client'

import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone'
import { createClient } from '@/lib/supabase/client'
import { useSupabaseUpload } from '@/hooks/use-supabase-upload'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const FileUploadDemo = () => {
  const [userId, setUserId] = useState<string | null>(null)
  const [gen_text, setGenText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    fetchUser()
  }, [supabase])

  // 업로드 성공 시 tts_requests에 행 삽입 + TTS Runner 호출 + 페이지 이동
  const onUploadSuccess = useCallback(
    async (uploadedFileUrls: string[]) => {
      if (!userId || uploadedFileUrls.length === 0) return
      
      setIsProcessing(true)
      setErrorMessage('')

      const filePath = uploadedFileUrls[0]

      // 1달(2592000초)짜리 signed URL 생성
      const { data, error: urlError } = await supabase
        .storage
        .from('prototype')
        .createSignedUrl(filePath, 60 * 60 * 24 * 30) // 30일

      if (urlError || !data?.signedUrl) {
        console.error('Error creating signed URL:', urlError?.message)
        setErrorMessage('Signed URL 생성에 실패했습니다.')
        setIsProcessing(false)
        return
      }

      const signedUrl = data.signedUrl

      // 1단계: tts_requests 테이블에 INSERT
      const { data: insertData, error } = await supabase
        .from('tts_requests')
        .insert({
          user_id: userId,
          reference_audio_storage_path: filePath,
          reference_audio_url: signedUrl,
          gen_text: gen_text,
          status: 'pending',
        })
        .select('tts_id')
        .single()

      if (error) {
        console.error('Error inserting tts_request:', error.message)
        setErrorMessage('TTS 요청 저장에 실패했습니다.')
        setIsProcessing(false)
        return
      }

      if (!insertData?.tts_id) {
        console.error('No tts_id returned from insert')
        setErrorMessage('TTS ID 생성에 실패했습니다.')
        setIsProcessing(false)
        return
      }

      // 2단계: TTS Runner Edge Function 호출
      try {
        console.log('Calling TTS Runner Edge Function...')
        console.log('Request payload:', {
          tts_id: insertData.tts_id,
          reference_audio_url: signedUrl,
          gen_text: gen_text,
          user_id: userId
        })
        
        const { data: functionData, error: functionError } = await supabase.functions.invoke('tts-runner', {
          body: {
            tts_id: insertData.tts_id,
            reference_audio_url: signedUrl,
            gen_text: gen_text,
            user_id: userId
          }
        })

        if (functionError) {
          console.error('Error calling TTS Runner:', functionError)
          console.error('Error details:', {
            message: functionError.message,
            name: functionError.name,
            status: functionError.status,
            statusText: functionError.statusText
          })
          
          // Update status to failed
          await supabase
            .from('tts_requests')
            .update({ 
              status: 'fail',
              error_message: `Edge Function Error: ${functionError.message}`
            })
            .eq('tts_id', insertData.tts_id)
        } else {
          console.log('TTS Runner called successfully:', functionData)
          // 성공적으로 호출되면 상태를 'in_progress'로 업데이트
          await supabase
            .from('tts_requests')
            .update({ status: 'in_progress' })
            .eq('tts_id', insertData.tts_id)
        }
      } catch (functionError) {
        console.error('Error calling TTS Runner function:', functionError)
        
        // Update status to failed
        await supabase
          .from('tts_requests')
          .update({ 
            status: 'fail',
            error_message: `Exception: ${functionError instanceof Error ? functionError.message : 'Unknown error'}`
          })
          .eq('tts_id', insertData.tts_id)
      }

      // 3단계: 결과 확인 페이지로 이동
      router.push(`/tts-result/${insertData.tts_id}`)
    },
    [userId, gen_text, supabase, router]
  )

  const props = useSupabaseUpload({
    bucketName: 'prototype',
    path: userId ? `reference/${userId}` : undefined,
    allowedMimeTypes: ['audio/*'],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 10, // 10MB
    upsert: true,
    onSuccess: onUploadSuccess,
  })

  return (
    <div className="w-[500px]">
      {userId ? (
        <>
          <input
            type="text"
            placeholder="변환할 텍스트를 입력하세요"
            value={gen_text}
            onChange={(e) => setGenText(e.target.value)}
            className="mb-4 w-full border border-gray-300 rounded px-2 py-1"
          />
          
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errorMessage}
            </div>
          )}
          
          {isProcessing && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              TTS 처리를 시작하고 있습니다...
            </div>
          )}
          
          <Dropzone {...props}>
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        </>
      ) : (
        <div>Loading user...</div>
      )}
    </div>
  )
}

export { FileUploadDemo }
