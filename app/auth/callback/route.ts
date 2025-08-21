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
        const user = userData.user;
        
        // 구글 OAuth와 이메일 회원가입을 구분
        const isGoogleOAuth = user.app_metadata?.provider === 'google';
        const isEmailSignup = user.app_metadata?.provider === 'email' || 
                             (!user.app_metadata?.provider && user.email_confirmed_at);
        
        if (isGoogleOAuth) {
          // 구글 OAuth의 경우: user_metadata에서 약관 동의 정보 확인
          const hasTermsInMetadata = user.user_metadata?.terms_agreed === true ||
                                   user.user_metadata?.terms_agreed === 'true' ||
                                   user.user_metadata?.terms_agreed === '1';
          
          if (hasTermsInMetadata) {
            // 약관 동의 정보가 있으면 DB에서 확인
            const { data: mappingData, error: mappingError } = await supabase
              .from('user_to_account_mapping')
              .select('account_id')
              .eq('user_id', user.id)
              .single();

            if (mappingError || !mappingData) {
              // 계정 매핑이 없으면 약관 동의 페이지로 리다이렉트
              return NextResponse.redirect(`${origin}/auth/terms/google`);
            }

            // DB에서 약관 동의 여부 확인
            const { data: termsData } = await supabase
              .from('terms_agreement')
              .select('agreed, critical_keys')
              .eq('account_id', mappingData.account_id)
              .single();

            // 약관 동의 여부 확인
            const hasAgreedToTerms = termsData && 
              termsData.agreed && 
              termsData.critical_keys &&
              termsData.critical_keys.terms_agreed && 
              termsData.critical_keys.voice_agreed && 
              termsData.critical_keys.copyright_agreed;
            
            if (hasAgreedToTerms) {
              // 이미 약관 동의를 완료한 사용자인 경우
              return NextResponse.redirect(`${origin}${next}`);
            } else {
                          // 약관 동의를 완료하지 않은 경우 약관 동의 페이지로 리다이렉트
            return NextResponse.redirect(`${origin}/auth/terms/google`);
            }
          } else {
            // 약관 동의 정보가 없으면 약관 동의 페이지로 리다이렉트
            return NextResponse.redirect(`${origin}/auth/terms/google`);
          }
        } else if (isEmailSignup) {
          // 이메일 회원가입의 경우: 이메일 인증 완료 여부 확인
          if (user.email_confirmed_at) {
            // 이메일 인증이 완료된 경우: 이메일 확인 완료 페이지로 이동
            return NextResponse.redirect(`${origin}/auth/email-confirmed`);
          } else {
            // 이메일 인증이 완료되지 않은 경우: 이메일 확인 페이지로 이동
            return NextResponse.redirect(`${origin}/auth/email-confirmed`);
          }
        } else {
          // 기타 경우 (예: 기존 사용자 로그인)
          return NextResponse.redirect(`${origin}${next}`);
        }
      }
    } else {
      console.error('Session exchange error:', error);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}