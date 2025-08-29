import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'AUTH_REQUIRED', message: '인증이 필요합니다.' }, { status: 401 })
    }

    // 요청 바디 파싱
    const body = await request.json().catch(() => ({}))
    const { reference_id, reference_audio_url, input_text } = body || {}

    if (!reference_id || !input_text) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: '필수 입력 누락(reference_id, input_text).' }, { status: 400 })
    }

    // 1) 일일 사용량 증가 시도 (원자적)
    const { data: usageRaw, error: usageError } = await supabase.rpc('increment_tts_usage', { user_uuid: user.id })
    if (usageError) {
      console.error('increment_tts_usage error:', usageError)
      return NextResponse.json({ error: 'USAGE_CHECK_FAILED', message: usageError.message }, { status: 500 })
    }

    const usageData = Array.isArray(usageRaw) ? (usageRaw[0] || null) : usageRaw
    if (!usageData?.allowed) {
      const status = usageData?.error_code === 'TERMS_REQUIRED' ? 403 : 429
      return NextResponse.json({
        error: usageData?.error_code || 'DAILY_LIMIT_EXCEEDED',
        message: usageData?.message || '하루 15회 생성 한도를 초과했습니다. 내일 00:00(KST)에 초기화됩니다.',
        used: usageData?.used ?? 15,
        remaining: usageData?.remaining ?? 0,
        reset_at: usageData?.reset_at,
      }, { status })
    }

    // 2) 통과 시 Edge Function 호출
    const { data: functionData, error: functionError } = await supabase.functions.invoke('rapid-worker', {
      body: {
        reference_id,
        reference_audio_url,
        input_text,
        user_id: user.id,
      }
    })

    if (functionError) {
      return NextResponse.json({ error: 'EDGE_FUNCTION_ERROR', message: functionError.message }, { status: functionError.status || 500 })
    }

    return NextResponse.json(functionData)
  } catch (error) {
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}


