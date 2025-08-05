import React, { useRef, useState, DragEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ProfileAvatarUploaderProps {
  bucketName: string
  path: string
  avatarUrl?: string
  onAvatarUploaded: (publicUrl: string) => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const AVATAR_SIZE = 256 // px

// publicUrl에서 storage 내 파일 경로 추출 (버킷명 이후 경로만, 쿼리스트링 제거)
function extractStoragePath(publicUrl: string, bucketName: string): string | null {
  try {
    const url = new URL(publicUrl);
    const prefix = `/object/public/${bucketName}/`;
    const idx = url.pathname.indexOf(prefix);
    if (idx === -1) return null;
    // avatars/USERID/파일명.jpg → USERID/파일명.jpg
    let fullPath = url.pathname.substring(idx + prefix.length);
    // 쿼리스트링 제거
    if (fullPath.includes('?')) {
      fullPath = fullPath.split('?')[0];
    }
    return decodeURIComponent(fullPath);
  } catch {
    return null;
  }
}

// 이미지를 256x256 정사각형 JPG로 변환
async function resizeImageToAvatar(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      // 정사각형 crop 영역 계산
      const minSide = Math.min(img.width, img.height)
      const sx = (img.width - minSide) / 2
      const sy = (img.height - minSide) / 2
      const canvas = document.createElement('canvas')
      canvas.width = AVATAR_SIZE
      canvas.height = AVATAR_SIZE
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(
        img,
        sx, sy, minSide, minSide, // source crop
        0, 0, AVATAR_SIZE, AVATAR_SIZE // dest
      )
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('이미지 변환 실패'))
        },
        'image/jpeg',
        0.92
      )
    }
    img.onerror = () => reject(new Error('이미지 로드 실패'))
    // 파일을 DataURL로 읽어서 img.src에 할당
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('이미지 읽기 실패'))
    reader.readAsDataURL(file)
  })
}

const ProfileAvatarUploader: React.FC<ProfileAvatarUploaderProps> = ({
  bucketName,
  path,
  avatarUrl,
  onAvatarUploaded,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFile = async (file: File) => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('최대 5MB 이하의 이미지만 업로드할 수 있습니다.')
      return
    }
    setLoading(true)
    try {
      // 1. 이미지를 256x256 JPG로 변환
      const avatarBlob = await resizeImageToAvatar(file)
      const supabase = createClient()
      // 2. 기존 아바타 이미지 삭제
      if (avatarUrl) {
        const storagePath = extractStoragePath(avatarUrl, bucketName)
        if (storagePath) {
          await supabase.storage.from(bucketName).remove([storagePath])
        }
      }
      // 3. 새 이미지 업로드
      const fileName = `${Date.now()}.jpg`
      const filePath = path ? `${path}/${fileName}` : fileName
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, avatarBlob, { upsert: true, contentType: 'image/jpeg' })
      if (uploadError) {
        setError('업로드 실패: ' + uploadError.message)
        setLoading(false)
        return
      }
      // 4. public URL 가져오기
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)
      if (data && data.publicUrl) {
        onAvatarUploaded(data.publicUrl)
      } else {
        setError('업로드는 성공했으나 URL을 가져오지 못했습니다.')
      }
    } catch (err) {
      if (err instanceof Error) {
        setError('알 수 없는 오류: ' + err.message)
      } else {
        setError('알 수 없는 오류')
      }
    }
    setLoading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleClick = () => {
    if (!loading) inputRef.current?.click()
  }

  // 드래그&드롭 이벤트 핸들러
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-pointer group transition-all duration-150 ${isDragOver ? 'ring-2 ring-blue-400 border-blue-400' : ''}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={0}
        role="button"
        aria-label="아바타 업로드"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="아바타"
            className="object-cover w-full h-full select-none pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 select-none pointer-events-none">
            <svg 
              className="w-12 h-12 text-gray-400 dark:text-gray-500" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        )}
        {/* 마우스 오버/드래그 시에만 보임 */}
        <div className={`absolute bottom-0 left-0 w-full bg-black bg-opacity-40 text-white text-xs text-center py-1 transition-opacity duration-150 ${isDragOver ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <span>사진 변경</span>
        </div>
        <input
          id="avatar-upload-input"
          name="avatar-upload-input"
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={loading}
        />
      </div>
      {loading && <p className="text-xs text-gray-500 mt-1">업로드 중...</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export default ProfileAvatarUploader 