import React from 'react'
import { Play, Pause } from 'lucide-react'

interface MinimalPlayButtonProps {
  isPlaying: boolean
  onClick: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function MinimalPlayButton({ 
  isPlaying, 
  onClick, 
  size = 'md',
  className = '' 
}: MinimalPlayButtonProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18
  }

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        border border-gray-300 dark:border-gray-600
        bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
        hover:bg-gray-50 dark:hover:bg-gray-700/80
        active:bg-gray-100 dark:active:bg-gray-600/80
        rounded-full
        transition-all duration-200
        hover:scale-105 active:scale-95
        shadow-sm hover:shadow-md
        ${className}
      `}
      aria-label={isPlaying ? '일시정지' : '재생'}
    >
      {isPlaying ? (
        <Pause 
          size={iconSizes[size]} 
          className="text-gray-700 dark:text-gray-300 ml-0.5" 
        />
      ) : (
        <Play 
          size={iconSizes[size]} 
          className="text-gray-700 dark:text-gray-300 ml-1" 
        />
      )}
    </button>
  )
} 