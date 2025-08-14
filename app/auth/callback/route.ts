import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  
  // redirectTo 쿼리 파라미터 확인 (Google 로그인에서 전달된 경우)
  const redirectTo = searchParams.get("redirectTo");
  // 로그인 후 메인 페이지로 이동 (기본값)
  const next = redirectTo || (searchParams.get("next") ?? "/");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 사용자 정보 가져오기
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData?.user) {
        // 사용자 메타데이터에서 약관 동의 상태 확인
        const userTermsAgreed = userData.user.user_metadata?.terms_agreed === true || 
                               userData.user.user_metadata?.terms_agreed === 'true' || 
                               userData.user.user_metadata?.terms_agreed === '1';
        const userVoiceAgreed = userData.user.user_metadata?.voice_agreed === true || 
                               userData.user.user_metadata?.voice_agreed === 'true' || 
                               userData.user.user_metadata?.voice_agreed === '1';
        const userCopyrightAgreed = userData.user.user_metadata?.copyright_agreed === true || 
                                   userData.user.user_metadata?.copyright_agreed === 'true' || 
                                   userData.user.user_metadata?.copyright_agreed === '1';
        
        // 이미 약관 동의를 완료한 사용자인 경우
        if (userTermsAgreed && userVoiceAgreed && userCopyrightAgreed) {
          return NextResponse.redirect(`${origin}${next}`);
        }
        
        // 약관 동의를 완료하지 않은 경우 약관 동의 페이지로 리다이렉트
        return NextResponse.redirect(`${origin}/auth/terms`);
      }
    } else {
      console.error('Session exchange error:', error);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}