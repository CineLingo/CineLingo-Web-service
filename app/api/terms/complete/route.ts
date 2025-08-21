import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    let body;
    let redirectTo: string | null = null;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {
        terms_agreed: formData.get('terms_agreed') === 'true',
        voice_agreed: formData.get('voice_agreed') === 'true',
        copyright_agreed: formData.get('copyright_agreed') === 'true',
        ai_agreed: formData.get('ai_agreed') === 'true'
      };
      redirectTo = formData.get('redirectTo') as string;
    } else {
      return NextResponse.json(
        { error: "지원하지 않는 Content-Type입니다." },
        { status: 400 }
      );
    }
    
    const { terms_agreed, voice_agreed, copyright_agreed, ai_agreed } = body;

    // 필수 필드 검증
    if (typeof terms_agreed !== 'boolean' || 
        typeof voice_agreed !== 'boolean' || 
        typeof copyright_agreed !== 'boolean' || 
        typeof ai_agreed !== 'boolean') {
      return NextResponse.json(
        { error: "모든 약관 동의 상태가 필요합니다." },
        { status: 400 }
      );
    }

    // 필수 약관 3개 모두 동의했는지 확인
    if (!terms_agreed || !voice_agreed || !copyright_agreed) {
      return NextResponse.json(
        { error: "필수 약관에 모두 동의해야 합니다." },
        { status: 400 }
      );
    }
    
    // 데이터베이스 함수 호출
    const { data, error } = await supabase.rpc('complete_terms_agreement', {
      user_uuid: user.id,
      terms_agreed,
      voice_agreed,
      copyright_agreed,
      ai_agreed
    });

    if (error) {
      console.error('약관 동의 완료 오류:', error);
      return NextResponse.json(
        { error: "약관 동의 처리 중 오류가 발생했습니다: " + error.message },
        { status: 500 }
      );
    }

    // 결과 확인
    if (data && data.success) {
      // 사용자 메타데이터 즉시 업데이트
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          terms_agreed: terms_agreed,
          voice_agreed: voice_agreed,
          copyright_agreed: copyright_agreed,
          ai_agreed: ai_agreed
        }
      });

      if (updateError) {
        console.error('사용자 메타데이터 업데이트 오류:', updateError);
        // 메타데이터 업데이트 실패해도 약관 동의는 성공으로 처리
      }

      // 서버에서 세션 갱신
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('서버 세션 갱신 오류:', refreshError);
      }

      // 리다이렉트할 URL 결정
      if (!redirectTo) {
        redirectTo = '/upload';
      }
      
      // 303 리다이렉트로 응답 (서버에서 세션 갱신 후)
      const redirectUrl = new URL(redirectTo, request.url);
      return NextResponse.redirect(redirectUrl, 303);
    } else {
      return NextResponse.json(
        { error: data?.error || "약관 동의 처리에 실패했습니다." },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('약관 동의 API 오류:', error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다: " + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
