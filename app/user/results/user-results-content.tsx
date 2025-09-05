"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ProfileAvatarUploader from "@/components/ProfileAvatarUploader";
import ShareButtonCompact from "@/components/ShareButtonCompact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { XCircle, Clock, AlertCircle, Mic, RefreshCw, CheckCircle, Volume2, Download, Check } from "lucide-react";
import Link from "next/link";
import { Eye } from "lucide-react";
import AudioPlayer from "@/components/AudioPlayer";
import ProfileAvatar from "@/components/ProfileAvatar";
import ShareRefButton from "@/components/ShareRefButton";
import FeedbackSheet from "@/components/feedback/FeedbackSheet";

type TTSRequestRow = {
  request_id: string;
  user_id: string;
  reference_id: string | null;
  ref_text_at_request: string;
  gen_text_at_request: string;
  status: string;
  created_at: string;
  updated_at: string;
  error_log?: string;
  gen_audios?: { 
    gen_file_url: string; 
    gen_file_path: string; 
    gen_text: string;
    gen_duration?: number;
    gen_is_public: boolean;
    gen_shared_title?: string;
    gen_shared_image?: string;
    ref_text_while_gen?: string;
  }[];
  ref_audios?: { ref_file_url: string; ref_text: string; ref_duration: number }[] | null;
};

function FeedbackButton({ ttsId }: { ttsId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [initial, setInitial] = useState<{ id?: string; rating_overall?: number; comment?: string } | undefined>(undefined)

  // 최초 마운트 시 피드백 존재 여부 확인
  const refreshFeedbackState = useCallback(async () => {
    const res = await fetch(`/api/feedback?tts_id=${encodeURIComponent(ttsId)}`)
    if (res.ok) {
      const data = await res.json()
      if (data?.exists && data?.feedback) {
        setMode('edit')
        setInitial({ id: data.feedback.id, rating_overall: data.feedback.rating_overall, comment: data.feedback.comment })
      } else {
        setMode('create')
        setInitial(undefined)
      }
    }
  }, [ttsId])

  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        setLoading(true)
        if (mounted) {
          await refreshFeedbackState()
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    check()
    return () => { mounted = false }
  }, [ttsId, refreshFeedbackState])

  const openSheet = useCallback(async () => {
    try {
      setOpen(true)
      if (initial || mode === 'edit') return
      setLoading(true)
      const res = await fetch(`/api/feedback?tts_id=${encodeURIComponent(ttsId)}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.exists && data?.feedback) {
          setMode('edit')
          setInitial({ id: data.feedback.id, rating_overall: data.feedback.rating_overall, comment: data.feedback.comment })
        } else {
          setMode('create')
          setInitial(undefined)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [ttsId, initial, mode])

  const hasFeedback = mode === 'edit' && !!initial?.id

  return (
    <>
      <button
        onClick={openSheet}
        disabled={loading}
        className={`${hasFeedback
          ? 'h-12 w-12 sm:h-11 sm:w-11 flex items-center justify-center bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
          : 'px-3 h-12 sm:h-11 flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700'
        }`}
        title={hasFeedback ? "피드백 완료" : "피드백"}
      >
        {hasFeedback ? <Check size={18} /> : <span className="text-sm">{loading ? '열기 중…' : '피드백'}</span>}
      </button>
      <FeedbackSheet
        ttsId={ttsId}
        open={open}
        onClose={() => setOpen(false)}
        onSubmitted={() => {
          // 제출 후 즉시 상태 반영
          setMode('edit')
          void refreshFeedbackState()
        }}
        mode={mode}
        initial={initial}
      />
    </>
  )
}

export default function UserResultsContent() {
  const [userId, setUserId] = useState<string | null>(null)
  const [rows, setRows] = useState<TTSRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [showTextModal, setShowTextModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClient()
  const [profile, setProfile] = useState<{ display_name: string; avatar_url: string } | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [editName, setEditName] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'tts' | 'reference'>('tts')

  // 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    fetchUser()
  }, [supabase])

  // user_id로 모든 TTS 요청 불러오기
  const fetchRows = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('tts_requests')
      .select(`
        request_id,
        user_id,
        reference_id,
        ref_text_at_request,
        gen_text_at_request,
        status,
        created_at,
        updated_at,
        error_log,
        gen_audios(gen_file_url, gen_file_path, gen_text, gen_duration, gen_is_public, gen_shared_title, gen_shared_image, ref_text_while_gen)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching TTS requests:', error);
      setLoading(false);
      return;
    }

    // 참조 오디오 정보도 함께 가져오기
    const rowsWithRefAudio = await Promise.all(
      (data || []).map(async (row) => {
        let refAudioData = null;
        if (row.reference_id) {
          const { data: refAudio } = await supabase
            .from('ref_audios')
            .select('ref_file_url, ref_text, ref_duration')
            .eq('ref_id', row.reference_id)
            .single();
          refAudioData = refAudio ? [refAudio] : null;
        }
        
        return {
          ...row,
          ref_audios: refAudioData
        };
      })
    );

    setRows(rowsWithRefAudio as TTSRequestRow[]);
    setLoading(false);
  }, [userId, supabase]);

  // 프로필 정보 가져오기
  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('users')
      .select('display_name, avatar_url')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Profile fetch warning:', error?.message);
    }

    // 프로필 정보가 비어있거나 없는 경우 기본값 설정
    let profileData: { display_name: string; avatar_url: string } = data ?? { display_name: '', avatar_url: '' };
    if (!data || (!data.display_name && !data.avatar_url)) {
      // 사용자 메타데이터에서 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      const userMetadata = user?.user_metadata;
      
      profileData = {
        display_name: userMetadata?.full_name || userMetadata?.name || user?.email?.split('@')[0] || '사용자',
        avatar_url: userMetadata?.avatar_url || userMetadata?.picture || ''
      };
      
      // users 테이블에 프로필 정보 저장
      const { error: updateError } = await supabase
        .from('users')
        .upsert({
          user_id: userId,
          display_name: profileData.display_name,
          avatar_url: profileData.avatar_url,
          email: user?.email || ''
        }, { onConflict: 'user_id' });
      
      if (updateError) {
        console.error('프로필 정보 저장 실패:', updateError);
      }
    }

    setProfile(profileData);
    setEditName(profileData.display_name || '');
    setProfileLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRows();
    setRefreshing(false);
  };

  const handleSaveName = async () => {
    if (!userId || !editName.trim()) {
      setNameError('닉네임을 입력해주세요.');
      return;
    }

    if (editName.length > 15) {
      setNameError('닉네임은 15자 이하로 입력해주세요.');
      return;
    }

    setSaving(true);
    setNameError(null);

    const { error } = await supabase
      .from('users')
      .update({ display_name: editName.trim() })
      .eq('user_id', userId);

    if (error) {
      setNameError('닉네임 저장에 실패했습니다.');
      setSaving(false);
      return;
    }

    setProfile(prev => prev ? { ...prev, display_name: editName.trim() } : null);
    setEditMode(false);
    setSaving(false);
  };

  // 아바타 업로드 후 URL 저장
  const handleAvatarUploaded = async (publicUrl: string) => {
    if (!userId) return
    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('user_id', userId)
    if (!error) {
      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : prev)
    }
    setSaving(false)
  }

  // 상태에 따른 아이콘과 색상
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="w-4 h-4 text-blue-500" />,
          color: 'text-blue-600 dark:text-blue-400',
          text: '완료'
        }
      case 'failed':
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
      case 'processing':
        return {
          icon: <AlertCircle className="w-4 h-4 text-blue-500" />,
          color: 'text-blue-600 dark:text-blue-400',
          text: '처리중 (약 50초 소요)'
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

  if (loading || profileLoading) {
    return (
      <div className="max-w-4xl mx-auto mt-4 sm:mt-8 p-4 sm:p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 dark:border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="max-w-4xl mx-auto mt-4 sm:mt-8 p-4 sm:p-8">
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-4">
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
        {/* 프로필 영역 */}
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 mb-8">
          <ProfileAvatarUploader
            bucketName="avatars"
            path={userId ? userId : ''}
            avatarUrl={profile?.avatar_url ? `${profile.avatar_url}?t=${Date.now()}` : undefined}
            onAvatarUploaded={handleAvatarUploaded}
          />
          <div className="flex flex-col items-center sm:items-start gap-2 w-full max-w-xs">
            {profileLoading ? (
              <div className="text-gray-500 text-sm">프로필 로딩 중...</div>
            ) : (
              <>
                {editMode ? (
                  <div className="flex flex-col gap-1 w-full">
                    <span className="text-gray-500 text-sm mb-1">닉네임은 15자 이하로 입력할 수 있습니다.</span>
                    <div className="flex gap-2 w-full">
                      <Input
                        id="edit-display-name-1"
                        name="edit-display-name-1"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1"
                        maxLength={15}
                      />
                      <Button onClick={handleSaveName} disabled={saving || !editName.trim()} size="sm">
                        저장
                      </Button>
                      <Button onClick={() => { setEditMode(false); setNameError(null); }} variant="secondary" size="sm">
                        취소
                      </Button>
                    </div>
                    {nameError && (
                      <span className="text-red-500 text-xs mt-1">{nameError}</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {profile?.display_name || '닉네임 없음'}
                    </span>
                    <Button onClick={() => setEditMode(true)} size="sm" variant="outline">
                      수정
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {/* 뷰 모드 스위칭 버튼 */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 shadow-lg">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('tts')}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  viewMode === 'tts'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  viewMode === 'tts' 
                    ? 'bg-white/20' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  <Volume2 size={isMobile ? 20 : 24} />
                </div>
                <div className="flex flex-col items-start">
                  <span className={`font-semibold text-sm sm:text-base ${
                    viewMode === 'tts' ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    TTS 음성
                  </span>
                  <span className={`text-xs ${
                    viewMode === 'tts' ? 'text-white/80' : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    생성된 음성
                  </span>
                </div>
              </button>
              <button
                onClick={() => setViewMode('reference')}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  viewMode === 'reference'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  viewMode === 'reference' 
                    ? 'bg-white/20' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  <Mic size={isMobile ? 20 : 24} />
                </div>
                <div className="flex flex-col items-start">
                  <span className={`font-semibold text-sm sm:text-base ${
                    viewMode === 'reference' ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    참조 음성
                  </span>
                  <span className={`text-xs ${
                    viewMode === 'reference' ? 'text-white/80' : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    원본 음성
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

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
  }

  return (
    <div className="max-w-4xl mx-auto mt-4 sm:mt-8 p-4 sm:p-8">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-4">
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
      {/* 프로필 영역 */}
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 mb-8">
        <ProfileAvatarUploader
          bucketName="avatars"
          path={userId ? userId : ''}
          avatarUrl={profile?.avatar_url ? `${profile.avatar_url}?t=${Date.now()}` : undefined}
          onAvatarUploaded={handleAvatarUploaded}
        />
        <div className="flex flex-col items-center sm:items-start gap-2 w-full max-w-xs">
          {profileLoading ? (
            <div className="text-gray-500 text-sm">프로필 로딩 중...</div>
          ) : (
            <>
              {editMode ? (
                <div className="flex flex-col gap-1 w-full">
                  <span className="text-gray-500 text-sm mb-1">닉네임은 15자 이하로 입력할 수 있습니다.</span>
                  <div className="flex gap-2 w-full">
                    <Input
                      id="edit-display-name-2"
                      name="edit-display-name-2"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1"
                      maxLength={15}
                    />
                    <Button onClick={handleSaveName} disabled={saving || !editName.trim()} size="sm">
                      저장
                    </Button>
                    <Button onClick={() => { setEditMode(false); setNameError(null); }} variant="secondary" size="sm">
                      취소
                    </Button>
                  </div>
                  {nameError && (
                    <span className="text-red-500 text-xs mt-1">{nameError}</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {profile?.display_name || '닉네임 없음'}
                  </span>
                  <Button onClick={() => setEditMode(true)} size="sm" variant="outline">
                    수정
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* 뷰 모드 스위칭 버튼 */}
      <div className="flex items-center justify-center mb-8">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 shadow-lg">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('tts')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                viewMode === 'tts'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                viewMode === 'tts' 
                  ? 'bg-white/20' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                <Volume2 size={isMobile ? 20 : 24} />
              </div>
              <div className="flex flex-col items-start">
                <span className={`font-semibold text-sm sm:text-base ${
                  viewMode === 'tts' ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  TTS 음성
                </span>
                <span className={`text-xs ${
                  viewMode === 'tts' ? 'text-white/80' : 'text-gray-500 dark:text-gray-500'
                }`}>
                  생성된 음성
                </span>
              </div>
            </button>
            <button
              onClick={() => setViewMode('reference')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                viewMode === 'reference'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                viewMode === 'reference' 
                  ? 'bg-white/20' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                <Mic size={isMobile ? 20 : 24} />
              </div>
              <div className="flex flex-col items-start">
                <span className={`font-semibold text-sm sm:text-base ${
                  viewMode === 'reference' ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  참조 음성
                </span>
                <span className={`text-xs ${
                  viewMode === 'reference' ? 'text-white/80' : 'text-gray-500 dark:text-gray-500'
                }`}>
                  원본 음성
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* TTS 결과 리스트 */}
      <div className="grid gap-3 sm:gap-4">
        {rows.map((row, i) => {
          const statusInfo = getStatusInfo(row.status)
          
          return (
            <div 
              key={row.request_id} 
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {/* 업로더 아바타 + 요청 시간 */}
              <div className="flex items-center gap-2 mb-2">
                <ProfileAvatar
                  avatarUrl={profile?.avatar_url}
                  alt={profile?.display_name || '프로필'}
                  size={20}
                  fallback="icon"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(row.created_at)}
                </div>
              </div>

              {/* TTS 뷰 모드 */}
              {viewMode === 'tts' && (
                <>
                  {/* 생성된 텍스트 (gen_text) */}
                  <div className="mb-3 sm:mb-4">
                    <p 
                      className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      onClick={() => {
                        const textToShow = row.gen_audios && row.gen_audios.length > 0 && row.gen_audios[0].gen_text
                          ? row.gen_audios[0].gen_text 
                          : row.gen_text_at_request
                        setSelectedText(textToShow)
                        setShowTextModal(true)
                      }}
                    >
                      {row.gen_audios && row.gen_audios.length > 0 && row.gen_audios[0].gen_text 
                        ? truncateText(row.gen_audios[0].gen_text, isMobile ? 1 : 2)
                        : truncateText(row.gen_text_at_request, isMobile ? 1 : 2)
                      }
                    </p>
                  </div>

                  {/* 플레이 바 & 재생시간 */}
                  <div className="mb-3 sm:mb-4">
                    {/* 생성된 오디오가 있으면 플레이어 표시 */}
                    {row.gen_audios && row.gen_audios.length > 0 ? (
                      <div className="w-full">
                        <AudioPlayer 
                          audioUrl={row.gen_audios[0].gen_file_url} 
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

                  {/* 버튼 영역: 왼쪽(다운/상태) 가변, 오른쪽 고정(피드백 최소폭, 공유 아이콘, 상세 아이콘) */}
                  <div className="flex items-center gap-2">
                    {/* 다운 버튼 또는 진행/실패 표시 (flex-1로 남은 공간 모두 차지) */}
                    {row.status === 'processing' || row.status === 'in_progress' || row.status === 'pending' ? (
                      <div className="flex-1 h-12 sm:h-11 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-lg">
                        <RefreshCw size={16} className="animate-spin" />
                        <span className="hidden sm:inline">진행 중</span>
                        <span className="sm:hidden">진행</span>
                      </div>
                    ) : row.status === 'failed' || row.status === 'fail' ? (
                      <div 
                        className="flex-1 h-12 sm:h-11 flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg relative group"
                        title={row.error_log || '처리 중 오류가 발생했습니다'}
                      >
                        <XCircle size={16} />
                        <span className="hidden sm:inline">실패</span>
                        <span className="sm:hidden">실패</span>
                        {row.error_log && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 max-w-xs break-words z-10">
                            {row.error_log}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (row.gen_audios && row.gen_audios.length > 0) {
                            handleDownload(row.gen_audios[0].gen_file_url, `tts-generated-${i + 1}.mp3`);
                          } else {
                            alert(`음성 파일을 찾을 수 없습니다. Status: ${row.status}, Gen audios: ${JSON.stringify(row.gen_audios)}`);                                                                                
                          }
                        }}
                        className="flex-1 h-12 sm:h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm rounded-lg transition-colors"
                        title="음성 파일 다운로드"
                      >
                        <Download size={16} />
                        <span>다운</span>
                      </button>
                    )}

                    {/* 피드백 버튼: 텍스트가 보이는 최소한의 크기 (flex-grow 없음) */}
                    <FeedbackButton ttsId={row.request_id} />

                    {/* 공유 버튼 (기존 아이콘형 유지, 오른쪽 끝) */}
                    <ShareButtonCompact ttsId={row.request_id} />

                    {/* 상세보기 (기존 아이콘형 유지, 가장 마지막) */}
                    <Link
                      href={`/user/results/${row.request_id}`}
                      className="h-12 w-12 sm:h-11 sm:w-11 flex items-center justify-center bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 rounded-lg transition-colors"
                      title="상세 보기"
                    >
                      <Eye size={18} />
                    </Link>
                  </div>
                </>
              )}

              {/* 참조 오디오 뷰 모드 */}
              {viewMode === 'reference' && (
                <>
                  {/* 참조 텍스트 */}
                  <div className="mb-3 sm:mb-4">
                    <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed">
                      {row.ref_audios && row.ref_audios.length > 0 
                        ? truncateText(row.ref_audios[0].ref_text || '참조 텍스트 없음', isMobile ? 1 : 2)
                        : '참조 오디오 없음'
                      }
                    </p>
                  </div>

                  {/* 참조 오디오 플레이어 */}
                  <div className="mb-3 sm:mb-4">
                    {row.ref_audios && row.ref_audios.length > 0 ? (
                      <div className="w-full">
                        <AudioPlayer 
                          audioUrl={row.ref_audios[0].ref_file_url}
                          width={isMobile ? 350 : 400}
                          height={isMobile ? 60 : 50}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                        <Mic size={16} />
                        <span>참조 오디오 없음</span>
                      </div>
                    )}
                  </div>

                  {/* 참조 오디오용 버튼 영역 - 참조 음성 공유 버튼 */}
                  <div className="flex items-center justify-center">
                    {row.ref_audios && row.ref_audios.length > 0 && row.reference_id ? (
                      <ShareRefButton
                        refId={row.reference_id}
                        text="참조 음성 공유"
                        variant="default"
                        size="md"
                        className="w-full h-12 sm:h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-sm rounded-lg transition-colors"
                      />
                    ) : (
                      <div className="w-full h-12 sm:h-11 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-lg">
                        <Mic size={16} />
                        <span>참조 오디오 없음</span>
                      </div>
                    )}
                  </div>
                </>
              )}
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
  );
}
