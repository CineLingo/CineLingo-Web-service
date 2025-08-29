'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

type Props = {
  ttsId: string
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
  mode?: 'create' | 'edit'
  initial?: Partial<Record<RatingKey, number>> & { comment?: string; id?: string }
}

type RatingKey = 'rating_overall'

const ratingLabels: Record<RatingKey, string> = {
  rating_overall: '만족도',
}

const fiveScale = [1, 2, 3, 4, 5]

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'feedback_session_id'
  let sid = localStorage.getItem(key)
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem(key, sid)
  }
  return sid
}

export default function FeedbackSheet({ ttsId, open, onClose, onSubmitted, mode = 'create', initial }: Props) {
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({ rating_overall: 0 })
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const disabled = useMemo(() => Object.values(ratings).some(v => v < 1 || v > 5), [ratings])

  const handleChange = useCallback((key: RatingKey, value: number) => {
    setRatings(prev => ({ ...prev, [key]: value }))
  }, [])

  useEffect(() => {
    if (!open) {
      setError(null)
      setSubmitting(false)
    }
    if (open && initial) {
      setRatings({ rating_overall: (initial?.rating_overall ?? 0) })
      setComment(initial.comment ?? '')
    }
  }, [open, initial])

  const handleSubmit = useCallback(async () => {
    if (disabled) return
    try {
      setSubmitting(true)
      setError(null)
      const sessionId = getOrCreateSessionId()
      const endpoint = '/api/feedback'
      const payload = {
        tts_id: ttsId,
        ...ratings,
        comment: comment?.trim() ? comment.trim() : undefined,
        session_id: sessionId,
        id: initial?.id
      }
      const res = await fetch(endpoint, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.status === 201 || res.status === 204 || res.status === 200) {
        onSubmitted?.()
        onClose()
        return
      }
      if (res.status === 409) {
        // 이미 제출된 경우도 성공 유사 처리
        onSubmitted?.()
        onClose()
        return
      }
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.message || '제출 중 오류가 발생했습니다')
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }, [disabled, ratings, comment, ttsId, onClose, onSubmitted, mode, initial?.id])

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-3 sm:p-5 flex flex-col overflow-hidden"
        style={{ maxHeight: 'min(85svh, 720px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">빠른 피드백</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="닫기">✕</button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">익명으로 수집되며, 민감정보 입력은 피해주세요.</p>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">{ratingLabels['rating_overall']}</label>
            <div className="flex items-center gap-2">
              {fiveScale.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleChange('rating_overall', n)}
                  className={`w-10 h-10 sm:w-9 sm:h-9 rounded-md border text-sm ${ratings['rating_overall'] === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
                  aria-pressed={ratings['rating_overall'] === n}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">자유 의견 (개선 사항, 사용 목적, 추가되었으면 하는 기능)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 140))}
              maxLength={140}
              rows={3}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-sm text-gray-900 dark:text-gray-100"
              placeholder="선택사항입니다."
            />
            <div className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">{comment.length}/140</div>
          </div>

          {error && <div className="text-xs text-red-600 dark:text-red-400">{error}</div>}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitting || disabled}
            className="flex-1 h-11 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm"
          >
            {submitting ? '제출 중…' : '제출하기'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-md border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm"
          >
            다음에 할게요
          </button>
        </div>
      </div>
    </div>
  )
}


