import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // const next = searchParams.get("next") ?? "/";

  // 1) 코드 교환 플로우 지원 (Supabase가 code 파라미터를 보내는 경우)
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // code 플로우 성공: 이메일 인증/로그인 관련 세션 교환 성공
      // 복구는 token_hash + type='recovery' 플로우에서만 처리하므로 여기선 안내 페이지로 이동
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.warn('코드 교환 후 signOut 실패:', signOutError);
      }
      return NextResponse.redirect(`${origin}/auth/email-confirmed?verified=1`);
    } else {
      // PKCE 관련 모든 실패 케이스는 안내 페이지로 폴백 처리
      const msg = (error.message || '').toLowerCase();
      const pkceIndicators = [
        'both auth code and code verifier',
        'code challenge',
        'code_verifier',
        'invalid verifier',
        'invalid_verifier',
        'invalid_grant',
        'pkce'
      ];
      if (pkceIndicators.some((s) => msg.includes(s))) {
        return NextResponse.redirect(`${origin}/auth/email-confirmed?verified=1`);
      }
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(`코드 교환에 실패했습니다: ${error.message}`)}`);
    }
  }

  // 2) token_hash + type 기반의 전통적인 OTP 검증 플로우 (크로스 앱 대응)
  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    if (!error) {
      // recovery 타입은 즉시 비밀번호 재설정으로 이동
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/update-password`);
      }

      // 자동 로그인 의존 제거: 무조건 로그아웃 후 로그인 페이지로 안내
      // (다른 사용자 세션이 엉킬 가능성을 차단)
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.warn('인증 후 signOut 실패:', signOutError);
      }

      // 이메일 인증 완료 안내 페이지로 이동하여 화면을 실제로 표시
      return NextResponse.redirect(`${origin}/auth/email-confirmed?verified=1`);
    } else {
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(`이메일 인증에 실패했습니다: ${error.message}`)}`);
    }
  } else {
    // 파라미터가 없을 때는 에러 안내 페이지로 이동
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent('No token hash or type')}`);
  }
}
