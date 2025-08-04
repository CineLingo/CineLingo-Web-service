import { useState, useEffect, useCallback } from 'react'

interface QueueInfo {
  position: number
  total_in_queue: number
  estimated_wait_time: number
  status?: string
}

interface QueueStats {
  queue_length: number
  running_jobs: number
}

interface UseQueueMonitorProps {
  requestId?: string | null
  enabled?: boolean
  pollingInterval?: number // 기본값 10초
}

export function useQueueMonitor({
  requestId,
  enabled = true,
  pollingInterval = 1000  // 10초 → 1초로 변경
}: UseQueueMonitorProps) {
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null)
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  // 큐 상태 조회 함수
  const fetchQueueStatus = useCallback(async () => {
    if (!requestId) return

    // 첫 번째 로딩만 표시 (이미 큐 정보가 있으면 로딩 표시 안함)
    if (!queueInfo) {
      setLoading(true)
    }
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/rapid-worker?request_id=${requestId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (data.status === 'OK') {
        setQueueInfo(data.queue_info)
        console.log('📊 Queue status updated:', data.queue_info)
      } else {
        setError(data.error || 'Failed to get queue status')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
      console.error('❌ Error fetching queue status:', err)
    } finally {
      setLoading(false)
    }
  }, [requestId, queueInfo])

  // 전체 큐 통계 조회 함수
  const fetchQueueStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/rapid-worker`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (data.status === 'OK') {
        setQueueStats(data.queue_info)
        console.log('📊 Queue stats updated:', data.queue_info)
      } else {
        setError(data.error || 'Failed to get queue stats')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
      console.error('❌ Error fetching queue stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 폴링 중지
  const stopPolling = useCallback(() => {
    setIsPolling(false)
    console.log('⏹️ Manual stop polling')
  }, [])

  // 큐 완료 상태 확인
  const isCompleted = queueInfo?.status === 'completed' || queueInfo?.status === 'failed'
  const isProcessing = queueInfo?.status === 'processing'
  const isWaiting = queueInfo?.status === 'waiting' || (queueInfo?.position || 0) > 0

  // 완료 상태 감지 시 폴링 중단
  useEffect(() => {
    if (isCompleted && isPolling) {
      console.log('✅ Queue completed, stopping polling immediately')
      setIsPolling(false)
    }
  }, [isCompleted, isPolling])

  // 자동 폴링 관리
  useEffect(() => {
    if (!enabled || !requestId) return

    setIsPolling(true)
    console.log('🔄 Starting queue polling for request:', requestId)

    // 즉시 첫 번째 조회
    fetchQueueStatus()

    // 3초 후 두 번째 조회 (빠른 초기 업데이트)
    const initialDelay = setTimeout(() => {
      fetchQueueStatus()
    }, 3000)

    // 주기적 폴링 (5초마다)
    const interval = setInterval(() => {
      fetchQueueStatus()
    }, pollingInterval)

    return () => {
      clearTimeout(initialDelay)
      clearInterval(interval)
      setIsPolling(false)
      console.log('⏹️ Stopped queue polling')
    }
  }, [enabled, requestId, fetchQueueStatus, pollingInterval])

  // 사용자 친화적 메시지 생성
  const getStatusMessage = () => {
    if (!queueInfo) return '큐 상태를 확인하는 중...'
    
    if (isCompleted) {
      return queueInfo.status === 'completed' ? '처리가 완료되었습니다!' : '처리에 실패했습니다.'
    }
    
    if (isProcessing) {
      return '현재 처리 중입니다...'
    }
    
    if (isWaiting) {
      return `현재 ${queueInfo.position || 0}번째로 대기 중입니다`
    }
    
    return '큐 상태를 확인하는 중...'
  }

  // 예상 대기 시간 포맷팅
  const getEstimatedWaitTime = () => {
    if (!queueInfo?.estimated_wait_time) return null
    
    const minutes = Math.floor(queueInfo.estimated_wait_time / 60)
    const seconds = queueInfo.estimated_wait_time % 60
    
    if (minutes > 0) {
      return `${minutes}분 ${seconds}초`
    }
    return `${seconds}초`
  }

  return {
    // 상태
    queueInfo,
    queueStats,
    loading,
    error,
    isPolling,
    
    // 상태 확인
    isCompleted,
    isProcessing,
    isWaiting,
    
    // 메시지
    statusMessage: getStatusMessage(),
    estimatedWaitTime: getEstimatedWaitTime(),
    
    // 액션
    fetchQueueStatus,
    fetchQueueStats,
    stopPolling
  }
} 