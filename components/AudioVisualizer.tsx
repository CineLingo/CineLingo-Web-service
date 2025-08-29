
'use client'

import React, { memo, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'

type AudioVisualizerProps = {
  active: boolean
  className?: string
  src?: string // lottie json 경로. 기본: /lottie/music-visualizer.json
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ active, className, src = '/lottie/music-visualizer.json' }) => {
  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null)
  const lottieRef = useRef<LottieRefCurrentProps>(null)

  // Lottie JSON 로드 (없으면 CSS 폴백 사용)
  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const res = await fetch(src)
        if (!res.ok) return
        const json = (await res.json()) as Record<string, unknown>
        if (isMounted) setAnimationData(json)
      } catch {
        // 폴백으로 넘어감
      }
    }
    load()
    return () => { isMounted = false }
  }, [src])

  // 재생 상태 제어
  useEffect(() => {
    if (!animationData || !lottieRef.current) return
    try {
      if (active) {
        lottieRef.current.play()
      } else {
        lottieRef.current.pause()
      }
    } catch {
      // ignore
    }
  }, [active, animationData])

  // 폴백 막대 데이터 제거 (사용 안 함)

  if (animationData) {
    return (
      <div className={clsx('h-10', className)} aria-hidden>
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop
          autoplay={false}
          style={{ height: '100%' }}
        />
      </div>
    )
  }

  // CSS 폴백 제거: 초기 로딩 시 시각적 깜빡임 방지용 빈 컨테이너(레이아웃만 유지)
  return <div className={clsx('h-10', className)} aria-hidden />
}

export default memo(AudioVisualizer)


