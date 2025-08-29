'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Volume2 } from 'lucide-react'
import MinimalPlayButton from './MinimalPlayButton'

interface AudioPlayerWithRealWaveformProps {
  audioUrl: string
  className?: string
  width?: number
  height?: number
}

export default function AudioPlayerWithRealWaveform({ 
  audioUrl, 
  className = '', 
  width = 400, 
  height = 80 
}: AudioPlayerWithRealWaveformProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)


  // 오디오 컨텍스트 초기화 및 웨이브폼 데이터 생성
  useEffect(() => {
    const generateWaveform = async () => {
      try {
        const response = await fetch(audioUrl)
        const arrayBuffer = await response.arrayBuffer()
        
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
          if (AudioContextClass) {
            audioContextRef.current = new AudioContextClass()
          }
        }
        
        const audioContext = audioContextRef.current
        if (!audioContext) {
          throw new Error('AudioContext가 초기화되지 않았습니다.')
        }
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        
        // 웨이브폼 데이터 추출
        const channelData = audioBuffer.getChannelData(0)
        const samples = 100 // 웨이브폼 바 개수
        const blockSize = Math.floor(channelData.length / samples)
        const waveform: number[] = []
        
        for (let i = 0; i < samples; i++) {
          const start = blockSize * i
          let sum = 0
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j])
          }
          waveform.push(sum / blockSize)
        }
        
        // 정규화 (0-1 범위로)
        const max = Math.max(...waveform)
        const normalizedWaveform = waveform.map(value => value / max)
        setWaveformData(normalizedWaveform)
      } catch (error) {
        console.error('웨이브폼 생성 실패:', error)
        // 폴백: 더미 데이터 생성 (일관된 데이터)
        const fallbackData = []
        for (let i = 0; i < 100; i++) {
          const x = Math.sin(i * 0.3) * 0.5 + 0.5
          fallbackData.push(x * 0.8 + 0.2)
        }
        setWaveformData(fallbackData)
      }
    }

    if (audioUrl) {
      generateWaveform()
    }
  }, [audioUrl])

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

  // 볼륨 변경
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = volume
    }
  }, [volume])

  // 재생/일시정지 토글
  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (isPlaying) {
        audio.pause()
      } else {
        // 오디오 컨텍스트 재시작 (브라우저 정책)
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume()
        }
        await audio.play()
      }
      setIsPlaying(!isPlaying)
    } catch (error) {
      console.error('오디오 재생 실패:', error)
    }
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

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div 
      className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${className}`}
      style={{ width, height }}
    >
      {/* 오디오 엘리먼트 */}
      <audio ref={audioRef} src={audioUrl} preload="auto" />
      
      {/* 플레이 버튼 */}
      <MinimalPlayButton
        isPlaying={isPlaying}
        onClick={togglePlay}
        size="lg"
      />

      {/* 웨이브폼 컨테이너 */}
      <div className="flex-1 relative">
        {/* 배경 웨이브폼 */}
        <div className="flex items-end gap-0.5 h-12">
          {waveformData.map((height, index) => (
            <div
              key={index}
              className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-sm transition-all duration-300"
              style={{ height: `${height * 100}%` }}
            />
          ))}
        </div>

        {/* 프로그레스 웨이브폼 (마스크 적용) */}
        <div 
          className="absolute top-0 left-0 flex items-end gap-0.5 h-12 overflow-hidden transition-all duration-100"
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
          className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 cursor-pointer rounded-full"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 볼륨 컨트롤 */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <Volume2 size={16} className="text-gray-500" />
        <input
          id="volume-control"
          name="volume-control"
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* 시간 표시 */}
      <div className="flex-shrink-0 text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-right">
        {audioRef.current ? (
          `${formatTime(audioRef.current.currentTime)} / ${formatTime(duration)}`
        ) : (
          '0:00 / 0:00'
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563EB 0%, #9333EA 100%);
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563EB 0%, #9333EA 100%);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
} 