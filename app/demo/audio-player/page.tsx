'use client'

import React from 'react'
import AudioPlayer from '@/components/AudioPlayer'
import AudioPlayerWithRealWaveform from '@/components/AudioPlayerWithRealWaveform'
import HomeButton from '@/components/home-button'

export default function AudioPlayerDemoPage() {
  // 샘플 오디오 URL (실제 오디오 파일로 교체 필요)
  const sampleAudioUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'

  return (
    <div className="max-w-4xl mx-auto mt-8 p-8">
      <HomeButton variant="floating" />
      
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
        오디오 플레이어 데모
      </h1>

      <div className="space-y-8">
        {/* 기본 오디오 플레이어 */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            기본 오디오 플레이어 (더미 웨이브폼)
          </h2>
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
            <AudioPlayer 
              audioUrl={sampleAudioUrl}
              width={500}
              height={80}
            />
          </div>
        </section>

        {/* 고급 오디오 플레이어 */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            고급 오디오 플레이어 (실제 웨이브폼)
          </h2>
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
            <AudioPlayerWithRealWaveform 
              audioUrl={sampleAudioUrl}
              width={500}
              height={80}
            />
          </div>
        </section>

        {/* 다양한 크기 */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            다양한 크기
          </h2>
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">작은 크기 (300x60)</p>
              <AudioPlayer 
                audioUrl={sampleAudioUrl}
                width={300}
                height={60}
              />
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">중간 크기 (400x80)</p>
              <AudioPlayer 
                audioUrl={sampleAudioUrl}
                width={400}
                height={80}
              />
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">큰 크기 (600x100)</p>
              <AudioPlayer 
                audioUrl={sampleAudioUrl}
                width={600}
                height={100}
              />
            </div>
          </div>
        </section>

        {/* 기능 설명 */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            주요 기능
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                🎵 재생 제어
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                재생/일시정지 버튼으로 오디오를 제어할 수 있습니다.
              </p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                📊 웨이브폼 시각화
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                회색 배경에 보라→빨강 그라디언트로 재생 진행률을 표시합니다.
              </p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                ⏱️ 프로그레스 바
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                클릭으로 원하는 위치로 이동할 수 있는 프로그레스 바입니다.
              </p>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                🔊 볼륨 제어
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                슬라이더로 볼륨을 조절할 수 있습니다 (고급 버전).
              </p>
            </div>
          </div>
        </section>

        {/* 사용법 */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            사용법
          </h2>
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
            <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{`import AudioPlayer from '@/components/AudioPlayer'

// 기본 사용법
<AudioPlayer 
  audioUrl="your-audio-file.mp3"
  width={400}
  height={80}
/>

// 고급 버전 (실제 웨이브폼)
import AudioPlayerWithRealWaveform from '@/components/AudioPlayerWithRealWaveform'

<AudioPlayerWithRealWaveform 
  audioUrl="your-audio-file.mp3"
  width={500}
  height={80}
/>`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  )
} 