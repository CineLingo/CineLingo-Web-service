'use client'

import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone'
import { createClient } from '@/lib/supabase/client'
import { useSupabaseUpload } from '@/hooks/use-supabase-upload'
import { useQueueMonitor } from '@/hooks/use-queue-monitor'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pause, Mic, Square, Music, User, Share2, ArrowLeft, AlertTriangle } from 'lucide-react'
import ProfileAvatar from '@/components/ProfileAvatar'
import { QueueStatusDisplay } from '@/components/QueueStatusDisplay'

// Supabase Storage list 반환 객체 타입 정의
type StorageObject = {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata?: object;
};

// RPC get_tts_usage 반환 타입
type UsageInfo = {
  used: number;
  remaining: number;
  reset_at: string | null;
  allowed: boolean;
  message: string | null;
};

function isUsageInfo(value: unknown): value is UsageInfo {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.remaining === 'number' &&
    (typeof v.used === 'number' || typeof v.used === 'undefined')
  );
}

  // 미리 업로드된 오디오 파일 목록
  const PRESET_AUDIO_FILES = [
    { name: '유재석 참고음성', file: '/yoojaeseok_ref1.wav', duration: '약 10초' },
    { name: '손석희 참고음성', file: '/sonsukhee_ref1.wav', duration: '약 8초' },
    { name: '이동진 참고음성', file: '/leedongjin_ref0.wav', duration: '약 8초' },
    { name: '아이유 참고음성', file: '/iu_ref0.wav', duration: '약 10초' },
    { name: '프랑스 튜터', file: '/franch_tutor.wav', duration: '약 9초' },
    { name: '침착맨', file: '/chimchakman.wav', duration: '약 9초' },
    { name: '지드래곤 참고음성', file: '/gdragon_ref1.wav', duration: '약 9초' },
  ]

  // 텍스트 예시 목록
  const TEXT_EXAMPLES = [
    {
      id: 1,
      title: '감사와 사랑의 메시지',
      text: '좋아하는 것, 싫어하는 것, 사소한 습관까지 섬세하게 기억해 주는 너를 보면서 이런 사람이 곁에 있다는 게 얼마나 큰 축복인지 알게 됐어.'
    },
    {
      id: 2,
      title: '위로와 격려',
      text: '오늘 하루도 정말 고생 많았어요. 눈에 보이지 않는 노력까지도 누군가는 분명히 알고 있을 거예요.'
    },
    {
      id: 3,
      title: '지지와 응원',
      text: '당신이 얼마나 열심히 살아가고 있는지 잘 알아요. 비록 지금은 결과가 보이지 않더라도, 그 모든 시간과 마음은 헛되지 않을 거예요.'
    },
    {
      id: 4,
      title: '따뜻한 위로',
      text: '괜히 네 마음속에 답을 혼자서만 품고 고민하지 않았으면 해. 언제든 괜찮으니, 네가 하고 싶은 말이 있다면 부담 갖지 말고 이야기해줘.'
    },
    {
      id: 5,
      title: '감사의 마음',
      text: '지금까지 제가 여기까지 올 수 있었던 건 다 부모님 덕분이에요. 말로 다 표현할 순 없지만, 마음속으론 늘 감사하고 또 감사하고 있어요.'
    }
  ]

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
  // 일일 사용량 상태
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null)
  
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
  const [recordingMime, setRecordingMime] = useState<string | null>(null)
  
  // 현재 단계 관리
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'text'>('upload')
  
  // 미리 선택된 오디오 관련 상태
  const [selectedPresetAudio, setSelectedPresetAudio] = useState<string | null>(null)
  const [showPresetAudioList, setShowPresetAudioList] = useState(false)
  
  // 내 음성 상태
  const [myVoices, setMyVoices] = useState<Array<{
    ref_id: string;
    ref_file_url: string;
    ref_file_path: string;
    created_at: string;
  }>>([])
  const [myProfile, setMyProfile] = useState<{ display_name?: string; avatar_url?: string } | null>(null)
  const [showMyVoices, setShowMyVoices] = useState(false)
  const [selectedMyVoice, setSelectedMyVoice] = useState<{
    ref_id: string;
    ref_file_url: string;
    ref_file_path: string;
    ref_text?: string;
  } | null>(null)
  
  // 공유 음성 상태
  const [sharedVoices, setSharedVoices] = useState<Array<{
    ref_id: string;
    ref_file_url: string;
    ref_file_path: string;
    created_at: string;
    shared_by_user?: {
      display_name?: string;
      email: string;
      avatar_url?: string;
    };
  }>>([])
  const [showSharedVoices, setShowSharedVoices] = useState(false)
  const [selectedSharedVoice, setSelectedSharedVoice] = useState<{
    ref_id: string;
    ref_file_url: string;
    ref_file_path: string;
    ref_text?: string;
  } | null>(null)
  
  // 텍스트 예시 관련 상태
  const [showTextExamples, setShowTextExamples] = useState(false)
  
  // TTS 요청 상태 관리
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  // useQueueMonitor 훅 사용
  const { isCompleted } = useQueueMonitor({ 
    requestId: currentRequestId, 
    enabled: !!currentRequestId 
  })

  // 완료 감지 시 네비게이션
  useEffect(() => {
    if (isCompleted && currentRequestId) {
      console.log('✅ TTS completed, navigating to results page...')
      // 즉시 결과 페이지로 이동
      router.push('/user/results')
    }
  }, [isCompleted, currentRequestId, router])

  // audioUrl이 변경될 때마다 ref 업데이트
  useEffect(() => {
    audioUrlRef.current = audioUrl
  }, [audioUrl])

  // 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        // 내 프로필 로드 (아바타 표기를 위해)
        const { data: p } = await supabase
          .from('users')
          .select('display_name, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle()
        setMyProfile(p || null)
      }
      // 로그인하지 않은 사용자는 미들웨어에서 처리되므로 여기서는 아무것도 하지 않음
    }
    fetchUser()
  }, [supabase])

  // 남은 횟수 조회
  const fetchUsage = useCallback(async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase
        .rpc('get_tts_usage', { user_uuid: userId })
      if (!error && data) {
        const row = Array.isArray(data) ? data[0] : data
        if (isUsageInfo(row)) setUsageRemaining(row.remaining as number)
      } else if (error) {
        console.error('get_tts_usage RPC error:', error?.message || error)
      }
    } catch {
      // 무시 (UI에 치명적이지 않음)
    }
  }, [supabase, userId])

  // 사용자 설정 후 사용량 조회
  useEffect(() => {
    if (userId) {
      fetchUsage()
    }
  }, [userId, fetchUsage])

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
        console.error('오디오 로드 에러')
        setErrorMessage('오디오 파일을 로드할 수 없습니다.')
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
      
      // 오디오 엘리먼트는 ref 한 개만 사용
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
      const preferredMimeTypes = [
        'audio/mp4;codecs=aac',
        'audio/webm;codecs=opus',
        'audio/webm'
      ]
      const supportedMime = preferredMimeTypes.find((type) => {
        try {
          return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)
        } catch {
          return false
        }
      })

      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream)
      setRecordingMime(recorder.mimeType || supportedMime || null)
      
      const chunks: Blob[] = []
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      recorder.onstop = () => {
        const effectiveType = recordingMime || recorder.mimeType || 'audio/webm'
        const blob = new Blob(chunks, { type: effectiveType })
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
  }, [recordingMime])

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
    setSelectedPresetAudio(null)
  }, [])

  // 녹음된 오디오를 파일로 변환하고 미리보기 설정
  const handleRecordedAudio = useCallback(() => {
    if (recordedAudioBlob) {
      const url = URL.createObjectURL(recordedAudioBlob)
      setAudioUrl(url)
      setShowPreview(true)
      
      // 오디오 엘리먼트는 ref 한 개만 사용
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
    }
  }, [recordedAudioBlob])

  // 미리 선택된 오디오 처리 함수
  const handlePresetAudioSelect = useCallback((audioFile: string) => {
    console.log('미리 선택된 오디오 선택:', audioFile)
    console.log('현재 currentStep:', currentStep)
    console.log('현재 showPreview:', showPreview)
    
    setSelectedPresetAudio(audioFile)
    setAudioUrl(audioFile)
    setShowPreview(true)
    setCurrentStep('preview')
    
    // 오디오 엘리먼트는 ref 한 개만 사용
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    
    // 녹음 관련 상태 초기화
    setRecordedAudioBlob(null)
    setAudioChunks([])
    setRecordingTime(0)
    
    setShowPresetAudioList(false)
    console.log('미리 선택된 오디오 설정 완료')
    console.log('설정 후 currentStep:', 'preview')
    console.log('설정 후 showPreview:', true)
  }, [currentStep, showPreview])

  // 텍스트 예시 선택 함수
  const handleTextExampleSelect = useCallback((exampleText: string) => {
    setGenText(exampleText)
    setShowTextExamples(false)
  }, [])

  // 프리셋 public 경로를 스토리지 키로 변환
  const toPresetStoragePath = useCallback((publicPath: string): string => {
    const base = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath
    return `preset_audio/${base}`
  }, [])

  // 이전 사용 음성 복사 금지: 별도 복사 없이 기존 경로를 그대로 사용

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
      // Blob을 File 객체로 변환 (mime/확장자 정합성 유지)
      const mime = recordedAudioBlob.type || recordingMime || 'audio/webm'
      const ext = mime.includes('audio/mp4') ? 'm4a' : (mime.includes('audio/webm') ? 'webm' : 'webm')
      const file = new File([recordedAudioBlob], `recorded_audio_${Date.now()}.${ext}`, {
        type: mime
      })
      
      // Supabase Storage에 업로드
      const fileName = `reference/${userId}/recorded_${Date.now()}.${ext}`
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
  }, [recordedAudioBlob, userId, supabase, recordingMime])



  // ref_audios에 오디오 업로드 후 ref_id 받아오기
  const uploadReferenceAudioAndGetRefId = useCallback(async (filePath: string, signedUrl: string) => {
    if (!userId) return null;
    
    // ref_audios에 insert
    const { data, error } = await supabase
      .from('ref_audios')
      .insert({
        user_id: userId,
        ref_file_url: signedUrl,
        ref_file_path: filePath,
        is_public: true,
      })
      .select('ref_id')
      .single();
    
    if (error) {
      console.error('참조 오디오 등록 실패:', error)
      setErrorMessage('참조 오디오 등록에 실패했습니다.');
      return null;
    }
    
    return data.ref_id;
  }, [userId, supabase])



  // 2. 내 음성 목록 불러오기 함수
  const fetchMyVoices = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('ref_audios')
        .select('ref_id, ref_file_url, ref_file_path, ref_text, created_at')
        .eq('user_id', userId)
        .not('ref_file_path', 'ilike', 'preset_audio/%')
        .order('created_at', { ascending: false });
      if (error) {
        setErrorMessage('내 음성 목록을 불러오지 못했습니다.');
        return;
      }
      if (data) setMyVoices(data);
    } catch {
      setErrorMessage('내 음성 목록을 불러오는 중 오류가 발생했습니다.');
    }
  }, [userId, supabase]);

  // 3. 내 음성 선택 핸들러
  const handleMyVoiceSelect = useCallback((voice: { ref_id: string; ref_file_url: string; ref_file_path: string; created_at: string }) => {
    setSelectedMyVoice(voice);
    setSelectedSharedVoice(null);
    setAudioUrl(voice.ref_file_url);
    setShowPreview(true);
    setCurrentStep('preview');
    // 오디오 엘리먼트는 ref 한 개만 사용
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setRecordedAudioBlob(null);
    setAudioChunks([]);
    setRecordingTime(0);
    setSelectedPresetAudio(null);
  }, [])

  // 4. 공유 음성 목록 불러오기 함수
  const fetchSharedVoices = useCallback(async () => {
    if (!userId) return;
    try {
      // 먼저 shared_ref_audios에서 ref_id 목록 가져오기
      const { data: sharedData, error: sharedError } = await supabase
        .from('shared_ref_audios')
        .select('ref_id')
        .eq('child_user_id', userId);
      
      if (sharedError) {
        console.error('공유 음성 목록 불러오기 오류:', sharedError);
        setErrorMessage('공유 음성 목록을 불러오지 못했습니다.');
        return;
      }
      
      if (sharedData && sharedData.length > 0) {
        const refIds = sharedData.map(item => item.ref_id);
        
        // ref_audios에서 상세 정보 가져오기
        const { data: refData, error: refError } = await supabase
          .from('ref_audios')
          .select('ref_id, ref_file_url, ref_file_path, ref_text, created_at, user_id')
          .in('ref_id', refIds);
        
        if (refError) {
          console.error('참조 음성 정보 불러오기 오류:', refError);
          return;
        }
        
        if (refData) {
          // 사용자 정보 가져오기
          const userIds = [...new Set(refData.map(item => item.user_id))];
          
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('user_id, display_name, email, avatar_url')
            .in('user_id', userIds);
          
          if (userError) {
            console.error('사용자 정보 불러오기 오류:', userError);
          }
          
          const userMap = new Map();
          if (userData) {
            userData.forEach(user => {
              userMap.set(user.user_id, user);
            });
          }
          
          const processedData = refData.map(ref => {
            const sharedByUser = userMap.get(ref.user_id) || { display_name: '익명 사용자', email: 'unknown@example.com' };
            
            return {
              ref_id: ref.ref_id,
              ref_file_url: ref.ref_file_url,
              ref_file_path: ref.ref_file_path,
              ref_text: ref.ref_text,
              created_at: ref.created_at,
              shared_by_user: sharedByUser
            };
          });
          
          setSharedVoices(processedData);
        }
      } else {
        setSharedVoices([]);
      }
    } catch (error) {
      console.error('공유 음성 목록 불러오기 중 오류:', error);
      console.error('에러 상세 정보:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      setErrorMessage('공유 음성 목록을 불러오는 중 오류가 발생했습니다.');
    }
  }, [userId, supabase]);

  // 5. 공유 음성 선택 핸들러
  const handleSharedVoiceSelect = useCallback((voice: { ref_id: string; ref_file_url: string; ref_file_path: string; created_at: string }) => {
    setSelectedSharedVoice(voice);
    setSelectedMyVoice(null);
    setAudioUrl(voice.ref_file_url);
    setShowPreview(true);
    setCurrentStep('preview');
    // 오디오 엘리먼트는 ref 한 개만 사용
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setRecordedAudioBlob(null);
    setAudioChunks([]);
    setRecordingTime(0);
    setSelectedPresetAudio(null);
  }, [])

  // 사용자 ID가 설정되면 내 음성과 공유 음성 목록 불러오기
  useEffect(() => {
    if (userId) {
      fetchMyVoices()
      fetchSharedVoices()
    }
  }, [userId, fetchMyVoices, fetchSharedVoices])

  // 통합된 TTS 시작 함수 - 모든 오디오 소스 처리
  const startTTS = useCallback(async () => {
    if (!userId || !gen_text.trim()) {
      setErrorMessage('계정 정보 또는 텍스트가 없습니다.')
      return
    }
    
    // 이미 처리 중이면 중단
    if (isProcessing) {
      console.log('이미 처리 중인 요청이 있습니다.')
      return
    }
    
    setIsProcessing(true)
    setErrorMessage('')

    try {

      let filePath: string | null = null
      let signedUrl: string | null = null
      let ref_id: string | null = null

      // 1단계: 오디오 소스에 따라 처리
      
      // 내 음성 분기
      if (selectedMyVoice) {
        filePath = selectedMyVoice.ref_file_path;
        signedUrl = selectedMyVoice.ref_file_url;
        ref_id = selectedMyVoice.ref_id;
      } else if (selectedSharedVoice) {
        // 공유 음성 분기
        filePath = selectedSharedVoice.ref_file_path;
        signedUrl = selectedSharedVoice.ref_file_url;
        ref_id = selectedSharedVoice.ref_id;
      } else if (recordedAudioBlob) {
        // 녹음된 오디오 처리
        filePath = await uploadRecordedAudio()
      } else if (selectedPresetAudio) {
        // 프리셋: 스토리지의 preset_audio/<파일>을 직접 사용
        filePath = toPresetStoragePath(selectedPresetAudio)
      } else {
        // 파일 업로드가 필요한 경우 - 이는 onUploadSuccess에 의해 처리됨
        setErrorMessage('오디오 파일을 선택해주세요.')
        setIsProcessing(false)
        return
      }

      if (!filePath) {
        setIsProcessing(false)
        return
      }

      // 2단계: signed URL 생성
      // 내 음성과 공유 음성 외에는 signedUrl/ref_id 생성
      if (!selectedMyVoice && !selectedSharedVoice) {
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

        signedUrl = data.signedUrl

        // 3단계: ref_audios에 insert 후 ref_id 받아오기
        ref_id = await uploadReferenceAudioAndGetRefId(filePath, signedUrl)
        if (!ref_id) {
          setIsProcessing(false)
          return
        }
      }



      // 5단계: 서버 API 호출 (일일 제한 검사 포함)
      try {
        const resp = await fetch('/api/tts/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference_id: ref_id,
            reference_audio_url: signedUrl,
            input_text: gen_text
          })
        })

        const json = await resp.json().catch(() => ({}))
        if (!resp.ok) {
          setErrorMessage(json?.message || '요청 처리 중 오류가 발생했습니다.')
          setIsProcessing(false)
          // 카운트가 증가하지 않았을 수도 있으니 최신 상태 조회
          fetchUsage()
          return
        }

        const requestId = json?.request_id
        if (!requestId) {
          setErrorMessage('요청 ID 생성에 실패했습니다.')
          setIsProcessing(false)
          return
        }

        setCurrentRequestId(requestId)
        // 최신 남은 횟수 갱신
        fetchUsage()
      } catch (functionError) {
        setErrorMessage(`요청 처리 중 오류: ${functionError instanceof Error ? functionError.message : 'Unknown error'}`)
        setIsProcessing(false)
        return
      }
      
    } catch (error) {
      console.error('TTS 처리 중 오류:', error)
      setErrorMessage('TTS 처리 중 오류가 발생했습니다.')
      setIsProcessing(false)
    }
  }, [
    userId, 
    gen_text, 
    recordedAudioBlob, 
    selectedPresetAudio, 
    selectedMyVoice,
    selectedSharedVoice,
    isProcessing,
    uploadRecordedAudio,
    toPresetStoragePath,
    supabase, 
    uploadReferenceAudioAndGetRefId,
    fetchUsage
  ])

  // 파일 업로드 성공 시 호출되는 함수 (기존 구조 유지)
  const onUploadSuccess = useCallback(
    async (uploadedFileUrls: string[]) => {
      if (!userId || uploadedFileUrls.length === 0) return
      
      // 파일 업로드가 완료되면 startTTS 함수를 호출
      await startTTS()
    },
    [userId, startTTS]
  )







  // 이전에 사용한 음성 목록 불러오기 함수
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchUsedAudioFiles = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase.storage.from('prototype').list(`reference/${userId}/`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'desc' },
      });
      if (error) {
        setErrorMessage('이전에 사용한 음성 목록을 불러오지 못했습니다.');
        return;
      }
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const files = data
          .filter((item: StorageObject) => item.name.endsWith('.wav') || item.name.endsWith('.webm'))
          .map((item: StorageObject) => ({
            name: item.name,
            file: `/reference/${userId}/${item.name}`,
          }));
        // setUsedAudioFiles(files); // 이 상태는 제거됨
      }
    } catch {
      setErrorMessage('이전에 사용한 음성 목록을 불러오는 중 오류가 발생했습니다.');
    }
  }, [userId, supabase]);

  // 이전에 사용한 음성 선택 핸들러 (signed URL 적용)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUsedAudioSelect = useCallback(async (audioFile: string) => {
    // signed URL 발급
    const filePath = audioFile.startsWith('/reference/')
      ? audioFile.replace('/reference/', 'reference/')
      : audioFile;
    const { data, error } = await supabase.storage
      .from('prototype')
      .createSignedUrl(filePath, 60 * 60 * 24 * 30); // 30일

    if (error || !data?.signedUrl) {
      setErrorMessage('오디오 파일을 불러오지 못했습니다.');
      return;
    }

    // 이전에 사용한 음성임을 표시하기 위해 selectedUsedAudio 상태 사용
    setSelectedPresetAudio(null); // 미리 선택된 오디오 초기화
    // setUsedAudioFile(filePath); // 새로운 상태로 이전 사용 음성 저장
    setAudioUrl(data.signedUrl);
    setShowPreview(true);
    setCurrentStep('preview');
    // 오디오 엘리먼트는 ref 한 개만 사용
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setRecordedAudioBlob(null);
    setAudioChunks([]);
    setRecordingTime(0);
    // setShowUsedAudioList(false); // 이 상태는 제거됨
  }, [supabase])

  const props = useSupabaseUpload({
    bucketName: 'prototype',
    path: userId ? `reference/${userId}` : undefined,
    allowedMimeTypes: ['audio/*'],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 5, // 5MB
    upsert: true,
    onSuccess: onUploadSuccess,
  })

  // 녹음 시작 시 파일 업로드 초기화
  const startRecordingWithFileReset = useCallback(async () => {
    // 기존 파일 업로드 초기화
    props.setFiles([])
    // 미리 선택된 오디오 초기화
    setSelectedPresetAudio(null)
    // 녹음 시작
    await startRecording()
  }, [props, startRecording])

  // 녹음 재시작 시 파일 업로드도 초기화
  const restartRecordingWithFileReset = useCallback(() => {
    restartRecording()
    props.setFiles([])
    setSelectedPresetAudio(null)
  }, [restartRecording, props])

  // 오디오 URL 변경 시 DOM 오디오 강제 로드 (iOS 호환)
  useEffect(() => {
    if (audioElement && audioUrl) {
      try {
        audioElement.load()
      } catch {
        // ignore
      }
    }
  }, [audioElement, audioUrl])

  // 미리 선택된 오디오 선택 시 파일 업로드 초기화
  const handlePresetAudioSelectWithReset = useCallback((audioFile: string) => {
    console.log('handlePresetAudioSelectWithReset 호출됨:', audioFile)
    // 먼저 파일 업로드 초기화
    props.setFiles([])
    // 이전 사용 음성 초기화
    // setUsedAudioFile(null) // 이 상태는 제거됨
    // 그 다음 미리 선택된 오디오 설정
    handlePresetAudioSelect(audioFile)
  }, [handlePresetAudioSelect, props])

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
      
      // 미리 선택된 오디오 및 이전 사용 음성 초기화 (파일이 실제로 업로드된 경우에만)
      if (props.files.length > 0) {
        setSelectedPresetAudio(null)
        // setUsedAudioFile(null) // 이 상태는 제거됨
      }
      
      // 새로운 파일 설정
      handleFileSelect(props.files)
    } else {
      // 파일이 없으면 미리보기 숨기기 (미리 선택된 오디오나 이전 사용 음성이 없을 때만)
      if (!selectedPresetAudio) { // && !usedAudioFile) // 이 상태는 제거됨
        clearAudioPreview()
      }
    }
  }, [props.files, handleFileSelect, clearAudioPreview, selectedPresetAudio])

  // 상태 변화 디버깅을 위한 useEffect
  useEffect(() => {
    console.log('상태 변화:', {
      currentStep,
      showPreview,
      selectedPresetAudio,
      audioUrl
    })
  }, [currentStep, showPreview, selectedPresetAudio, audioUrl])

  // 미리 선택된 오디오 처리 함수

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
    <div className="w-full max-w-md mx-auto px-4 sm:px-0">
      {userId ? (
        <div className="space-y-4 sm:space-y-6">
          {/* 단계 표시 */}
          <div className="flex items-center justify-center space-x-4 sm:space-x-8 mb-6 sm:mb-8">
                          <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === 'upload' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentStep === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  1
                </div>
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">업로드</span>
              </div>
              <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === 'preview' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentStep === 'preview' ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  2
                </div>
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">미리듣기</span>
              </div>
              <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === 'text' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentStep === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  3
                </div>
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">텍스트</span>
              </div>
          </div>
          {currentStep === 'upload' && (
            <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 p-3 text-xs sm:text-sm">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>입력 오디오는 무조건 한국어 음성만 사용해 주세요.</span>
              </div>
            </div>
          )}
          {currentStep === 'text' && (
            <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 p-3 text-xs sm:text-sm">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span>입력 텍스트는 발음나는 대로 한글만 입력해 주세요</span>
                  <span className="block mt-1 text-[11px] text-amber-700 dark:text-amber-300">(예: 12시 → 열두시, Hi → 하이)</span>
                </div>
              </div>
            </div>
          )}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}
          
          {isProcessing && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
              TTS 처리를 시작하고 있습니다...
            </div>
          )}

          {/* Step 1: 업로드/녹음 */}
          {currentStep === 'upload' && (
            <div className="space-y-4 sm:space-y-6 pb-16">
              {/* 1. 녹음하기 */}
              <div className="text-center">
                {!isRecording ? (
                  <div className="flex justify-center">
                    <button
                      onClick={startRecordingWithFileReset}
                      className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation"
                    >
                      <Mic size={20} className="sm:w-6 sm:h-6" />
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
                        className="w-14 h-14 sm:w-16 sm:h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation"
                      >
                        <Square size={20} className="sm:w-6 sm:h-6" />
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {isRecording ? '녹음 중지' : '녹음하기'}
                </p>
              </div>

              {/* 2. 오디오 파일 업로드 */}
              <div className="text-center">
                <Dropzone {...props} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 sm:p-8 hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-gray-50 dark:bg-gray-900/50">
                  <DropzoneEmptyState />
                  <DropzoneContent />
                </Dropzone>
              </div>

              {/* 또는 구분선 */}
              <div className="flex items-center">
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
                <span className="px-4 text-xs text-gray-500 dark:text-gray-400">또는</span>
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
              </div>

              {/* 3. 미리 준비된 음성 선택 */}
              <div className="text-center">
                <button
                  onClick={() => {
                    const newState = !showPresetAudioList;
                    setShowPresetAudioList(newState);
                    if (newState) {
                      // 다음 tick에서 스크롤 실행
                      setTimeout(() => {
                        const element = document.getElementById('preset-audio-list');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                      }, 100);
                    }
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center justify-center space-x-2 touch-manipulation"
                >
                  <Music size={18} className="sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">프리셋</span>
                </button>
                
                {showPresetAudioList && (
                  <div id="preset-audio-list" className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                    {PRESET_AUDIO_FILES.map((audio, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          console.log('미리 선택된 오디오 버튼 클릭됨:', audio.file)
                          handlePresetAudioSelectWithReset(audio.file)
                        }}
                        className="w-full p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                              <Music size={14} className="sm:w-4 sm:h-4 text-white" />
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {audio.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {audio.duration}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                            선택
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. 내 음성 */}
              <button
                onClick={async () => {
                  const newState = !showMyVoices;
                  if (!showMyVoices) await fetchMyVoices();
                  setShowMyVoices(newState);
                  if (newState) {
                    // 다음 tick에서 스크롤 실행
                    setTimeout(() => {
                      const element = document.getElementById('my-voices-list');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                    }, 100);
                  }
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center space-x-2 touch-manipulation"
              >
                <User size={18} className="sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">내 음성</span>
              </button>
              {showMyVoices && (
                <div id="my-voices-list" className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {myVoices.length === 0 ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400">저장된 내 음성이 없습니다.</div>
                  ) : (
                    myVoices.map((voice, index) => (
                      <button
                        key={index}
                        onClick={() => handleMyVoiceSelect(voice)}
                        className="w-full p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <ProfileAvatar avatarUrl={myProfile?.avatar_url} alt={myProfile?.display_name || '내 프로필'} size={24} fallback="icon" />
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {voice.ref_file_path.split('/').pop()}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(voice.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                            선택
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* 5. 공유 음성 */}
              <button
                onClick={async () => {
                  const newState = !showSharedVoices;
                  if (!showSharedVoices) await fetchSharedVoices();
                  setShowSharedVoices(newState);
                  if (newState) {
                    // 다음 tick에서 스크롤 실행
                    setTimeout(() => {
                      const element = document.getElementById('shared-voices-list');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                    }, 100);
                  }
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center space-x-2 touch-manipulation"
              >
                <Share2 size={18} className="sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">공유 음성</span>
              </button>
              {showSharedVoices && (
                <div id="shared-voices-list" className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {sharedVoices.length === 0 ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400">공유받은 음성이 없습니다.</div>
                  ) : (
                    sharedVoices.map((voice, index) => (
                      <button
                        key={index}
                        onClick={() => handleSharedVoiceSelect(voice)}
                        className="w-full p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <ProfileAvatar avatarUrl={voice.shared_by_user?.avatar_url} alt={voice.shared_by_user?.display_name || '업로더'} size={24} fallback="icon" />
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {voice.ref_file_path.split('/').pop()}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {voice.shared_by_user?.display_name || '익명 사용자'} • {new Date(voice.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                            선택
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: 미리듣기 */}
          {(() => {
            const shouldShowPreview = currentStep === 'preview' && (showPreview || selectedPresetAudio || selectedMyVoice || selectedSharedVoice)
                          console.log('미리듣기 조건 확인:', {
                currentStep,
                showPreview,
                selectedPresetAudio,
                selectedMyVoice,
                selectedSharedVoice,
                shouldShowPreview
              })
            return shouldShowPreview
          })() && (
            <div className="space-y-4 sm:space-y-6">
              {/* 미리듣기 헤더 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {recordedAudioBlob ? '녹음 완료 · 미리듣기' : 
                   selectedPresetAudio ? '미리듣기' : 
                   selectedMyVoice ? '내 음성 · 미리듣기' :
                   selectedSharedVoice ? '공유 음성 · 미리듣기' :
                   '업로드 완료 · 미리듣기'}
                </span>
                                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }
                      restartRecordingWithFileReset()
                      setSelectedPresetAudio(null)
                      setSelectedMyVoice(null)
                      setSelectedSharedVoice(null)
                    }}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center space-x-1"
                  >
                    <span>뒤로가기</span>
                    <ArrowLeft size={14} />
                  </button>
              </div>

              {/* 미니멀 오디오 플레이어 */}
              <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-3 sm:p-4 border border-gray-300 dark:border-gray-700">
                {/* 숨겨진 오디오 엘리먼트 */}
                {audioUrl && (
                  <audio
                    ref={(el) => {
                      if (el) setAudioElement(el)
                    }}
                    src={audioUrl}
                    preload="auto"
                    style={{ display: 'none' }}
                  />
                )}
                
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    onClick={togglePlayPause}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow border border-gray-300 dark:border-gray-600 touch-manipulation"
                  >
                    {isPlaying ? <Pause size={14} className="sm:w-4 sm:h-4 text-gray-700 dark:text-white" /> : <Play size={14} className="sm:w-4 sm:h-4 text-gray-700 dark:text-white" />}
                  </button>
                  <div className="flex-1 space-y-1">
                    <div 
                      className="h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden cursor-pointer"
                      onClick={handleProgressClick}
                    >
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: duration > 0 && !isNaN(duration) ? `${(currentTime / duration) * 100}%` : '0%' }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
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
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                  setCurrentStep('text')
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-full font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 touch-manipulation"
              >
                다음 단계
              </button>
            </div>
          )}

          {/* Step 3: 텍스트 입력 */}
          {currentStep === 'text' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">생성하고 싶은 텍스트</label>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }
                      setCurrentStep('preview')
                    }}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center space-x-1"
                  >
                    <span>뒤로가기</span>
                    <ArrowLeft size={14} />
                  </button>
                </div>
                
                {/* 텍스트 예시 선택 버튼 */}
                <button
                  type="button"
                  onClick={() => setShowTextExamples(!showTextExamples)}
                  className="w-full py-2 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between touch-manipulation"
                >
                  <span>텍스트 예시 선택하기</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {showTextExamples ? '접기' : '펼치기'}
                  </span>
                </button>
                
                {/* 텍스트 예시 목록 */}
                {showTextExamples && (
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900">
                    {TEXT_EXAMPLES.map((example) => (
                      <button
                        key={example.id}
                        onClick={() => handleTextExampleSelect(example.text)}
                        className="w-full p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors touch-manipulation"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {example.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {example.text}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                <textarea
                  id="tts-text-input"
                  name="tts-text-input"
                  value={gen_text}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 150) {
                      setGenText(value);
                    }
                  }}
                  placeholder="원하는 텍스트를 입력하세요... (최대 150자)"
                  maxLength={150}
                  className="w-full h-24 px-3 sm:px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base sm:text-base"
                />
                <div className="flex justify-end">
                  <span className={`text-xs ${gen_text.length >= 150 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {gen_text.length}/150
                  </span>
                </div>
              </div>

              {/* 큐 상태 표시 */}
              {currentRequestId && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <QueueStatusDisplay requestId={currentRequestId} />
                </div>
              )}
              {/* 디버깅용 로그 */}
              {(() => { console.log('currentRequestId:', currentRequestId); return null; })()}

              {/* TTS 생성 시작 버튼 */}
              <button
                onClick={() => {
                  // 파일 업로드인 경우 props.onUpload 호출, 다른 경우 startTTS 호출
                  if (!recordedAudioBlob && !selectedPresetAudio && props.files.length > 0) {
                    props.onUpload()
                  } else {
                    startTTS()
                  }
                }}
                disabled={
                  (props.files.length > 0 && props.files.some((file) => file.errors.length !== 0)) || 
                  !gen_text.trim() ||
                  isProcessing ||
                  (usageRemaining !== null && usageRemaining <= 0)
                }
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-full font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {isProcessing ? '처리 중...' : 'TTS 생성 시작'}
              </button>
              {/* 남은 횟수 배지 */}
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                {usageRemaining === null ? '남은 횟수 확인 중…' : `오늘 남은 생성 ${usageRemaining}/15`}
                {usageRemaining !== null && usageRemaining <= 0 && (
                  <span className="block text-red-500 mt-1">하루 15회 한도를 초과했습니다. 내일 00:00(KST)에 초기화됩니다.</span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">Loading user...</div>
      )}
    </div>
  )
}

export default FileUploadDemo
