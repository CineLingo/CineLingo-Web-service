'use client'

import React, { useState } from 'react'
import MinimalPlayButton from '@/components/MinimalPlayButton'

export default function MinimalPlayButtonDemoPage() {
  const [playingStates, setPlayingStates] = useState<{ [key: string]: boolean }>({
    button1: false,
    button2: false,
    button3: false,
    button4: false,
    button5: false,
    button6: false,
  })

  const togglePlay = (buttonId: string) => {
    setPlayingStates(prev => ({
      ...prev,
      [buttonId]: !prev[buttonId]
    }))
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-8">
      
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
        Minimal Play Button
      </h1>

      <div className="space-y-8">
        {/* Size Variations */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            크기별 변형
          </h2>
          <div className="flex items-center gap-6 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-center">
              <MinimalPlayButton
                isPlaying={playingStates.button1}
                onClick={() => togglePlay('button1')}
                size="sm"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Small (32px)</p>
            </div>
            
            <div className="text-center">
              <MinimalPlayButton
                isPlaying={playingStates.button2}
                onClick={() => togglePlay('button2')}
                size="md"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Medium (40px)</p>
            </div>
            
            <div className="text-center">
              <MinimalPlayButton
                isPlaying={playingStates.button3}
                onClick={() => togglePlay('button3')}
                size="lg"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Large (48px)</p>
            </div>
          </div>
        </section>

        {/* Waveform Context */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            웨이브폼과 함께 사용
          </h2>
          <div className="space-y-4">
            {/* Small waveform */}
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
              <MinimalPlayButton
                isPlaying={playingStates.button4}
                onClick={() => togglePlay('button4')}
                size="sm"
              />
              <div className="flex-1 flex items-end gap-0.5 h-8">
                {Array.from({ length: 30 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-sm"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Medium waveform */}
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
              <MinimalPlayButton
                isPlaying={playingStates.button5}
                onClick={() => togglePlay('button5')}
                size="md"
              />
              <div className="flex-1 flex items-end gap-0.5 h-12">
                {Array.from({ length: 40 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-sm"
                    style={{ height: `${Math.random() * 80 + 20}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Large waveform */}
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
              <MinimalPlayButton
                isPlaying={playingStates.button6}
                onClick={() => togglePlay('button6')}
                size="lg"
              />
              <div className="flex-1 flex items-end gap-0.5 h-16">
                {Array.from({ length: 50 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-sm"
                    style={{ height: `${Math.random() * 100 + 20}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Design Features */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            디자인 특징
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                🎯 미니멀 디자인
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                원형 테두리만 사용하여 가벼운 느낌을 줍니다. 배경은 반투명으로 처리되어 자연스럽게 어울립니다.
              </p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                🎨 색상 조화
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                회색 계열의 색상을 사용하여 웨이브폼과 조화를 이룹니다. 다크 모드도 완벽하게 지원합니다.
              </p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                ✨ 부드러운 애니메이션
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                호버 시 살짝 확대되고, 클릭 시 눌리는 효과로 상호작용을 명확하게 표현합니다.
              </p>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                📱 반응형 크기
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                sm, md, lg 세 가지 크기로 웨이브폼 높이에 맞춰 균형잡힌 비율을 제공합니다.
              </p>
            </div>
          </div>
        </section>

        {/* Usage */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            사용법
          </h2>
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
            <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{`import MinimalPlayButton from '@/components/MinimalPlayButton'

// 기본 사용법
<MinimalPlayButton
  isPlaying={isPlaying}
  onClick={togglePlay}
  size="md"
/>

// 크기 옵션
size="sm"  // 32px (8x8)
size="md"  // 40px (10x10) - 기본값
size="lg"  // 48px (12x12)

// 커스텀 스타일
<MinimalPlayButton
  isPlaying={isPlaying}
  onClick={togglePlay}
  size="lg"
  className="border-blue-300 hover:border-blue-400"
/>`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  )
} 