'use client'

import React, { useState, useRef, useEffect } from 'react'
import MinimalPlayButton from './MinimalPlayButton'

interface AudioPlayerProps {
  audioUrl: string
  className?: string
  width?: number
  height?: number
}

export default function AudioPlayer({ 
  audioUrl, 
  className = '', 
  width = 400, 
  height = 80 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)


  // 오디오 메타데이터 로드
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  // 재생/일시정지 토글
  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  // 프로그레스 클릭 핸들러
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = (clickX / rect.width) * 100
    const newTime = (percentage / 100) * audio.duration
    
    audio.currentTime = newTime
    setProgress(percentage)
  }

  // 터치 이벤트 핸들러 (모바일용)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const rect = e.currentTarget.getBoundingClientRect()
    const touch = e.touches[0]
    const clickX = touch.clientX - rect.left
    const percentage = (clickX / rect.width) * 100
    const newTime = (percentage / 100) * audio.duration
    
    audio.currentTime = newTime
    setProgress(percentage)
  }

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 웨이브폼 데이터 생성 (더미 데이터) - 모바일에서는 더 적은 바
  const generateWaveformData = (count: number) => {
    // 일관된 웨이브폼을 위해 고정된 시드 사용
    const seed = 12345 // 고정 시드
    const data = []
    for (let i = 0; i < count; i++) {
      // 간단한 의사 랜덤 함수
      const x = Math.sin(i * 0.5 + seed) * 0.5 + 0.5
      data.push(x * 0.8 + 0.2)
    }
    return data
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

  // 화면 크기에 따라 웨이브폼 바 개수 조정
  const waveformData = generateWaveformData(isMobile ? 30 : 50)

  return (
    <div 
      className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${className}`}
      style={{ width: '100%', maxWidth: width, height }}
    >
      {/* 오디오 엘리먼트 */}
      <audio ref={audioRef} src={audioUrl} preload="auto" />
      
      {/* 플레이 버튼 */}
      <MinimalPlayButton
        isPlaying={isPlaying}
        onClick={togglePlay}
        size={isMobile ? "md" : "lg"}
      />

      {/* 웨이브폼 컨테이너 */}
      <div className="flex-1 relative">
        {/* 배경 웨이브폼 */}
        <div className="flex items-end gap-0.5 h-8 sm:h-12">
          {waveformData.map((height, index) => (
            <div
              key={index}
              className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-sm"
              style={{ height: `${height * 100}%` }}
            />
          ))}
        </div>

        {/* 프로그레스 웨이브폼 (마스크 적용) */}
        <div 
          className="absolute top-0 left-0 flex items-end gap-0.5 h-8 sm:h-12 overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          {waveformData.map((height, index) => (
            <div
              key={index}
              className="flex-1 rounded-sm"
              style={{ 
                height: `${height * 100}%`,
                background: 'linear-gradient(135deg, #2563EB 0%, #9333EA 50%, #DB2777 100%)'
              }}
            />
          ))}
        </div>

        {/* 프로그레스 바 */}
        <div 
          className="absolute bottom-0 left-0 w-full h-1 sm:h-0.5 bg-gray-200 dark:bg-gray-700 cursor-pointer rounded-full"
          onClick={handleProgressClick}
          onTouchStart={handleTouchStart}
        >
          <div 
            className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transition-all duration-100 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 시간 표시 */}
      <div className="flex-shrink-0 text-xs sm:text-sm text-gray-600 dark:text-gray-400 min-w-[50px] sm:min-w-[60px] text-right">
        {audioRef.current ? (
          `${formatTime(audioRef.current.currentTime)} / ${formatTime(duration)}`
        ) : (
          '0:00 / 0:00'
        )}
      </div>
    </div>
  )
} 