'use client'

import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone'
import { createClient } from '@/lib/supabase/client'
import { useSupabaseUpload } from '@/hooks/use-supabase-upload'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Play, Pause, Volume2, Mic, Square, RotateCcw } from 'lucide-react'

const FileUploadDemo = () => {
  const [userId, setUserId] = useState<string | null>(null)
  const [gen_text, setGenText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  
  // 녹음 관련 상태
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null)
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  // audioUrl이 변경될 때마다 ref 업데이트
  useEffect(() => {
    audioUrlRef.current = audioUrl
  }, [audioUrl])

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

  // 오디오 재생/일시정지 토글
  const togglePlayPause = useCallback(() => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause()
      } else {
        audioElement.play()
      }
      setIsPlaying(!isPlaying)
    }
  }, [audioElement, isPlaying])

  // 오디오 이벤트 리스너 설정
  useEffect(() => {
    if (audioElement) {
      const handleEnded = () => setIsPlaying(false)
      const handlePlay = () => setIsPlaying(true)
      const handlePause = () => setIsPlaying(false)

      audioElement.addEventListener('ended', handleEnded)
      audioElement.addEventListener('play', handlePlay)
      audioElement.addEventListener('pause', handlePause)

      return () => {
        audioElement.removeEventListener('ended', handleEnded)
        audioElement.removeEventListener('play', handlePlay)
        audioElement.removeEventListener('pause', handlePause)
      }
    }
  }, [audioElement])

  // 파일이 선택되면 미리보기 URL 생성
  const handleFileSelect = useCallback((files: File[]) => {
    if (files.length > 0) {
      const file = files[0]
      const url = URL.createObjectURL(file)
      setAudioUrl(url)
      setShowPreview(true)
      
      // 새로운 오디오 엘리먼트 생성
      const audio = new Audio(url)
      setAudioElement(audio)
      setIsPlaying(false)
    }
  }, [])

  // 파일 정리 함수
  const clearAudioPreview = useCallback(() => {
    setShowPreview(false)
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      setAudioUrl(null)
    }
    setAudioElement(null)
    setIsPlaying(false)
  }, [])

  // 컴포넌트 언마운트 시 URL 정리
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
      // 녹음 타이머 정리
      if (recordingTimer) {
        clearInterval(recordingTimer)
      }
    }
  }, [recordingTimer])

  // 녹음 시작 함수
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      const chunks: Blob[] = []
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setRecordedAudioBlob(blob)
        setAudioChunks(chunks)
        
        // 스트림 정리
        stream.getTracks().forEach(track => track.stop())
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)
      
      // 녹음 시간 타이머 시작
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      setRecordingTimer(timer)
      
    } catch (error) {
      console.error('녹음을 시작할 수 없습니다:', error)
      setErrorMessage('마이크 권한이 필요합니다. 브라우저 설정을 확인해주세요.')
    }
  }, [])

  // 녹음 중지 함수
  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      
      // 타이머 정리
      if (recordingTimer) {
        clearInterval(recordingTimer)
        setRecordingTimer(null)
      }
    }
  }, [mediaRecorder, isRecording, recordingTimer])

  // 녹음 재시작 함수
  const restartRecording = useCallback(() => {
    setRecordedAudioBlob(null)
    setAudioChunks([])
    setRecordingTime(0)
    setShowPreview(false)
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      setAudioUrl(null)
    }
    setAudioElement(null)
    setIsPlaying(false)
  }, [])

  // 녹음된 오디오를 파일로 변환하고 미리보기 설정
  const handleRecordedAudio = useCallback(() => {
    if (recordedAudioBlob) {
      const url = URL.createObjectURL(recordedAudioBlob)
      setAudioUrl(url)
      setShowPreview(true)
      
      // 새로운 오디오 엘리먼트 생성
      const audio = new Audio(url)
      setAudioElement(audio)
      setIsPlaying(false)
    }
  }, [recordedAudioBlob])

  // 녹음된 오디오가 변경될 때마다 미리보기 설정
  useEffect(() => {
    if (recordedAudioBlob) {
      handleRecordedAudio()
    }
  }, [recordedAudioBlob, handleRecordedAudio])

  // 녹음된 오디오를 Supabase에 업로드하는 함수
  const uploadRecordedAudio = useCallback(async (): Promise<string | null> => {
    if (!recordedAudioBlob || !userId) return null
    
    try {
      // Blob을 File 객체로 변환
      const file = new File([recordedAudioBlob], `recorded_audio_${Date.now()}.webm`, {
        type: 'audio/webm'
      })
      
      // Supabase Storage에 업로드
      const fileName = `reference/${userId}/recorded_${Date.now()}.webm`
      const { data, error } = await supabase.storage
        .from('prototype')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        console.error('녹음 오디오 업로드 실패:', error)
        setErrorMessage('녹음 오디오 업로드에 실패했습니다.')
        return null
      }
      
      return fileName
    } catch (error) {
      console.error('녹음 오디오 업로드 중 오류:', error)
      setErrorMessage('녹음 오디오 업로드 중 오류가 발생했습니다.')
      return null
    }
  }, [recordedAudioBlob, userId, supabase])

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

  // 녹음된 오디오로 TTS 시작하는 함수
  const startTTSWithRecordedAudio = useCallback(async () => {
    if (!userId || !recordedAudioBlob || !gen_text.trim()) return
    
    setIsProcessing(true)
    setErrorMessage('')
    
    try {
      // 1단계: 녹음된 오디오 업로드
      const filePath = await uploadRecordedAudio()
      if (!filePath) {
        setIsProcessing(false)
        return
      }
      
      // 2단계: signed URL 생성
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

      // 3단계: tts_requests 테이블에 INSERT
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

      // 4단계: TTS Runner Edge Function 호출
      try {
        console.log('Calling TTS Runner Edge Function with recorded audio...')
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

      // 5단계: 결과 확인 페이지로 이동
      router.push(`/tts-result/${insertData.tts_id}`)
      
    } catch (error) {
      console.error('녹음 오디오 TTS 처리 중 오류:', error)
      setErrorMessage('TTS 처리 중 오류가 발생했습니다.')
      setIsProcessing(false)
    }
  }, [userId, recordedAudioBlob, gen_text, uploadRecordedAudio, supabase, router])

  const props = useSupabaseUpload({
    bucketName: 'prototype',
    path: userId ? `reference/${userId}` : undefined,
    allowedMimeTypes: ['audio/*'],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 10, // 10MB
    upsert: true,
    onSuccess: onUploadSuccess,
  })

  // 녹음 시작 시 파일 업로드 초기화
  const startRecordingWithFileReset = useCallback(async () => {
    // 기존 파일 업로드 초기화
    props.setFiles([])
    // 녹음 시작
    await startRecording()
  }, [props, startRecording])

  // 녹음 재시작 시 파일 업로드도 초기화
  const restartRecordingWithFileReset = useCallback(() => {
    restartRecording()
    props.setFiles([])
  }, [restartRecording, props])

  // 파일이 선택되면 미리보기 표시
  useEffect(() => {
    if (props.files.length > 0) {
      // 기존 오디오 정리
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
      setAudioUrl(null)
      setAudioElement(null)
      setIsPlaying(false)
      
      // 녹음된 오디오 초기화
      setRecordedAudioBlob(null)
      setAudioChunks([])
      setRecordingTime(0)
      
      // 새로운 파일 설정
      handleFileSelect(props.files)
    } else {
      // 파일이 없으면 미리보기 숨기기
      clearAudioPreview()
    }
  }, [props.files, handleFileSelect, clearAudioPreview])

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

          {/* 녹음 섹션 */}
          <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Mic size={16} className="text-gray-500" />
              직접 녹음하기
            </h3>
            
            {!isRecording && !recordedAudioBlob && (
              <div className="space-y-3">
                <p className="text-xs text-gray-600">
                  마이크를 사용하여 직접 음성을 녹음할 수 있습니다.
                </p>
                <Button
                  onClick={startRecordingWithFileReset}
                  className="w-full"
                  variant="outline"
                  size="sm"
                >
                  <Mic size={16} className="mr-2" />
                  녹음 시작
                </Button>
              </div>
            )}
            
            {isRecording && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-red-600">녹음 중...</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <Button
                  onClick={stopRecording}
                  className="w-full"
                  variant="destructive"
                  size="sm"
                >
                  <Square size={16} className="mr-2" />
                  녹음 중지
                </Button>
              </div>
            )}
            
            {recordedAudioBlob && !isRecording && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600">녹음 완료</span>
                  <Button
                    onClick={restartRecordingWithFileReset}
                    variant="ghost"
                    size="sm"
                  >
                    <RotateCcw size={14} className="mr-1" />
                    다시 녹음
                  </Button>
                </div>
                <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                  <p>✅ 녹음이 완료되었습니다.</p>
                  <p>🎵 아래 미리보기에서 녹음된 음성을 확인하세요.</p>
                </div>
              </div>
            )}
          </div>

          {/* 오디오 미리보기 섹션 */}
          {showPreview && audioUrl && (
            <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Volume2 size={16} className="text-gray-500" />
                  오디오 미리보기
                </h3>
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                  {props.files[0]?.name}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={togglePlayPause}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2 min-w-[80px]"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    {isPlaying ? '일시정지' : '재생'}
                  </Button>
                  <div className="flex-1">
                    <audio
                      ref={(el) => {
                        if (el) setAudioElement(el)
                      }}
                      src={audioUrl}
                      className="w-full"
                      controls
                      preload="metadata"
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                  <p>✅ 오디오 파일이 성공적으로 선택되었습니다.</p>
                  <p>🎵 위의 컨트롤을 사용하여 오디오를 미리 들어보세요.</p>
                  <p>📝 변환할 텍스트를 입력하고 "TTS 생성 시작" 버튼을 클릭하세요.</p>
                </div>
              </div>
            </div>
          )}
          
          <Dropzone {...props}>
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>

          {/* TTS 생성 시작 버튼 */}
          {((showPreview && props.files.length > 0) || recordedAudioBlob) && !props.loading && (
            <div className="mt-4">
              <Button
                onClick={recordedAudioBlob ? startTTSWithRecordedAudio : props.onUpload}
                disabled={
                  (props.files.length > 0 && props.files.some((file) => file.errors.length !== 0)) || 
                  !gen_text.trim() ||
                  isProcessing
                }
                className="w-full"
                size="lg"
              >
                {isProcessing ? '처리 중...' : 'TTS 생성 시작'}
              </Button>
              {!gen_text.trim() && (
                <p className="text-xs text-red-500 mt-1">
                  변환할 텍스트를 입력해주세요.
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div>Loading user...</div>
      )}
    </div>
  )
}

export { FileUploadDemo }
