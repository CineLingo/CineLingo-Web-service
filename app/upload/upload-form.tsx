'use client'

import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone'
import { createClient } from '@/lib/supabase/client'
import { useSupabaseUpload } from '@/hooks/use-supabase-upload'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, Mic, Square, RotateCcw } from 'lucide-react'

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
  
  // 오디오 진행률 관련 상태
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  // 녹음 관련 상태
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null)
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)
  
  // 현재 단계 관리
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'text'>('upload')
  
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
      const handleTimeUpdate = () => setCurrentTime(audioElement.currentTime)
      const handleLoadedMetadata = () => {
        if (audioElement.duration && !isNaN(audioElement.duration)) {
          setDuration(audioElement.duration)
        }
      }
      const handleError = () => {
        console.error('오디오 로딩 실패')
        setDuration(0)
        setCurrentTime(0)
      }

      audioElement.addEventListener('ended', handleEnded)
      audioElement.addEventListener('play', handlePlay)
      audioElement.addEventListener('pause', handlePause)
      audioElement.addEventListener('timeupdate', handleTimeUpdate)
      audioElement.addEventListener('loadedmetadata', handleLoadedMetadata)
      audioElement.addEventListener('error', handleError)

      return () => {
        audioElement.removeEventListener('ended', handleEnded)
        audioElement.removeEventListener('play', handlePlay)
        audioElement.removeEventListener('pause', handlePause)
        audioElement.removeEventListener('timeupdate', handleTimeUpdate)
        audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audioElement.removeEventListener('error', handleError)
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
      setCurrentStep('preview')
      
      // 새로운 오디오 엘리먼트 생성
      const audio = new Audio(url)
      setAudioElement(audio)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
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
    setCurrentStep('upload')
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
        setCurrentStep('preview')
        
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
      setErrorMessage('마이크 권한이 필요합니다.')
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
    setCurrentStep('upload')
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
      setCurrentTime(0)
      setDuration(0)
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
      const { error } = await supabase.storage
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

      // 3단계: 결과 목록 페이지로 이동
      router.push(`/user/results`)
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

      // 5단계: 결과 목록 페이지로 이동
      router.push(`/user/results`)
      
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



  // 시간 포맷 함수
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 진행률 바 클릭 핸들러
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioElement || duration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    const newTime = (percentage / 100) * duration;
    
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {userId ? (
        <div className="space-y-6">
          {/* 단계 표시 */}
          <div className="flex items-center justify-center space-x-8 mb-8">
            <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-blue-400' : 'text-gray-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">업로드</span>
            </div>
            <div className={`flex items-center space-x-2 ${currentStep === 'preview' ? 'text-blue-400' : 'text-gray-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === 'preview' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">미리듣기</span>
            </div>
            <div className={`flex items-center space-x-2 ${currentStep === 'text' ? 'text-blue-400' : 'text-gray-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">텍스트</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}
          
          {isProcessing && (
            <div className="p-3 bg-blue-900/50 border border-blue-700 text-blue-300 rounded-lg text-sm">
              TTS 처리를 시작하고 있습니다...
            </div>
          )}

          {/* Step 1: 업로드/녹음 */}
          {currentStep === 'upload' && (
            <div className="space-y-4">
              {/* 녹음 버튼 */}
              <div className="text-center">
                {!isRecording ? (
                  <div className="flex justify-center">
                    <button
                      onClick={startRecordingWithFileReset}
                      className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Mic size={24} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-red-400">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={stopRecording}
                        className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Square size={24} />
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {isRecording ? '녹음 중지' : '녹음하기'}
                </p>
              </div>

              {/* 또는 구분선 */}
              <div className="flex items-center">
                <div className="flex-1 h-px bg-gray-700"></div>
                <span className="px-4 text-xs text-gray-500">또는</span>
                <div className="flex-1 h-px bg-gray-700"></div>
              </div>

              {/* 파일 업로드 */}
              <div className="text-center">
                <Dropzone {...props} className="border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-gray-500 transition-colors bg-gray-900/50">
                  <DropzoneEmptyState />
                  <DropzoneContent />
                </Dropzone>
              </div>
            </div>
          )}

          {/* Step 2: 미리듣기 */}
          {currentStep === 'preview' && showPreview && (
            <div className="space-y-4">
              {/* 미리듣기 헤더 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-200">
                  {recordedAudioBlob ? '녹음 완료 · 미리듣기' : '업로드 완료 · 미리듣기'}
                </span>
                <button
                  onClick={restartRecordingWithFileReset}
                  className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {/* 미니멀 오디오 플레이어 */}
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                {/* 숨겨진 오디오 엘리먼트 */}
                {audioUrl && (
                  <audio
                    ref={(el) => {
                      if (el) setAudioElement(el)
                    }}
                    src={audioUrl}
                    preload="metadata"
                    style={{ display: 'none' }}
                  />
                )}
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={togglePlayPause}
                    className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow border border-gray-600"
                  >
                    {isPlaying ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white" />}
                  </button>
                  <div className="flex-1 space-y-1">
                    <div 
                      className="h-1 bg-gray-700 rounded-full overflow-hidden cursor-pointer"
                      onClick={handleProgressClick}
                    >
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: duration > 0 && !isNaN(duration) ? `${(currentTime / duration) * 100}%` : '0%' }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>
                        {formatTime(currentTime)}
                      </span>
                      <span>
                        {isNaN(duration) ? '0:00' : formatTime(duration)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 다음 단계 버튼 */}
              <button
                onClick={() => setCurrentStep('text')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-full font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
              >
                다음 단계
              </button>
            </div>
          )}

          {/* Step 3: 텍스트 입력 */}
          {currentStep === 'text' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">변환할 텍스트</label>
                <textarea
                  value={gen_text}
                  onChange={(e) => setGenText(e.target.value)}
                  placeholder="원하는 텍스트를 입력하세요..."
                  className="w-full h-24 px-4 py-3 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
                />
              </div>

              {/* TTS 생성 시작 버튼 */}
              <button
                onClick={recordedAudioBlob ? startTTSWithRecordedAudio : props.onUpload}
                disabled={
                  (props.files.length > 0 && props.files.some((file) => file.errors.length !== 0)) || 
                  !gen_text.trim() ||
                  isProcessing
                }
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-full font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? '처리 중...' : 'TTS 생성 시작'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-400">Loading user...</div>
      )}
    </div>
  )
}

export default FileUploadDemo
