import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const termsAgreed = searchParams.get("terms_agreed") === "true";
  const voiceAgreed = searchParams.get("voice_agreed") === "true";
  const copyrightAgreed = searchParams.get("copyright_agreed") === "true";
  const aiAgreed = searchParams.get("ai_agreed") === "true";
  
  // 로그인 후 메인 페이지로 이동
  const next = searchParams.get("next") ?? "/";

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
        
        // 새로운 약관 동의 정보가 있는 경우
        if (termsAgreed && voiceAgreed && copyrightAgreed) {
          // 사용자 메타데이터에 약관 동의 정보 저장
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              terms_agreed: termsAgreed,
              voice_agreed: voiceAgreed,
              copyright_agreed: copyrightAgreed,
              ai_agreed: aiAgreed
            }
          });
          
          if (updateError) {
            console.error('구글 회원가입 - 메타데이터 업데이트 실패:', updateError);
          }
          
          // 약관 동의 완료 시 메인 페이지로 이동
          return NextResponse.redirect(`${origin}${next}`);
        } else {
          // 약관 동의 정보가 없거나 불완전한 경우 약관 동의 페이지로 리다이렉트
          return NextResponse.redirect(`${origin}/auth/terms`);
        }
      }
    } else {
      console.error('Session exchange error:', error);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}