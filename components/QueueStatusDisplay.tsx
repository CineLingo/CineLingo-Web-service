import React from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useQueueMonitor } from '@/hooks/use-queue-monitor'

interface QueueStatusDisplayProps {
  requestId?: string | null
  className?: string
}

export function QueueStatusDisplay({ requestId, className = '' }: QueueStatusDisplayProps) {
  const {
    queueInfo,
    loading,
    error,
    isCompleted,
    isProcessing,
    isWaiting,
    statusMessage,
    estimatedWaitTime
  } = useQueueMonitor({ requestId })

  if (!requestId) {
    return null
  }

  if (loading && !queueInfo) {
    return (
      <div className={`flex items-center space-x-2 text-blue-600 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">큐 상태를 확인하는 중...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-red-600 ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">큐 상태 확인 실패: {error}</span>
      </div>
    )
  }

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

  if (isCompleted) {
    return (
      <div className={`flex items-center space-x-2 ${queueInfo?.status === 'completed' ? 'text-green-600' : 'text-red-600'} ${className}`}>
        {queueInfo?.status === 'completed' ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        <span className="text-sm">{statusMessage}</span>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className={`flex flex-col space-y-2 ${className}`}>
        {/* 진행중 상태 */}
        <div className="flex items-center space-x-2 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">현재 처리 중입니다...</span>
        </div>
        
        {/* 대기 정보도 함께 표시 */}
        {queueInfo && (queueInfo.position > 0 || queueInfo.total_in_queue > 0) && (
          <div className="flex items-center space-x-2 text-orange-600">
            <Clock className="h-4 w-4" />
            <div className="flex flex-col">
                              <span className="text-sm">
                  현재 {queueInfo.position || 0}번째로 대기 중입니다
                </span>
              {estimatedWaitTime && (
                <span className="text-xs text-gray-500">
                  예상 대기 시간: {estimatedWaitTime}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isWaiting) {
    return (
      <div className={`flex items-center space-x-2 text-orange-600 ${className}`}>
        <Clock className="h-4 w-4" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{statusMessage}</span>
          {estimatedWaitTime && (
            <span className="text-xs text-gray-500">
              예상 대기 시간: {estimatedWaitTime}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
      <Clock className="h-4 w-4" />
      <span className="text-sm">큐 상태를 확인하는 중...</span>
    </div>
  )
} 