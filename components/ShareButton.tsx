'use client'

import React, { useState } from 'react'
import { Share2, X } from 'lucide-react'

interface ShareButtonProps {
  ttsId: string
  text?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function ShareButton({ 
  ttsId, 
  text = "공유하기",
  className = "",
  variant = "default",
  size = "md"
}: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${ttsId}`

  // 공유 버튼 클릭 핸들러
  const handleShareClick = () => {
    // 항상 모달 표시 (더 안정적)
    setShowModal(true)
  }

  // 클립보드에 링크 복사
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
      alert('링크 복사에 실패했습니다.')
    }
  }

  // 버튼 스타일 클래스
  const getButtonClasses = () => {
    const baseClasses = "inline-flex items-center gap-2 font-medium transition-all duration-300"
    
    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm", 
      lg: "px-6 py-3 text-base"
    }

    const variantClasses = {
      default: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg",
      outline: "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg",
      ghost: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
    }

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`
  }

  return (
    <>
      <button
        onClick={handleShareClick}
        className={getButtonClasses()}
        title="공유하기"
      >
        <Share2 size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
        {text}
      </button>

      {/* 공유 모달 */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false)
            }
          }}
        >
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg w-full max-w-md">
            <div className="p-6">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">공유하기</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 공유 URL 표시 */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">공유 링크</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  >
                    {copied ? '복사됨!' : '복사'}
                  </button>
                </div>
              </div>

              {/* 안내 메시지 */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  모바일에서는 자동으로 공유 옵션이 표시됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 