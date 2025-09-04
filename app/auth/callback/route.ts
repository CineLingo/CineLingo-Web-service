import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkUserTermsFromMetadata } from "@/lib/terms";

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
        
        // 현재 사용자에 구글 ID가 연결되어 있으면 구글 OAuth 흐름으로 간주
        const hasGoogleIdentity = Array.isArray(user.identities) && user.identities.some((identity) => identity.provider === 'google');
        const isGoogleOAuth = user.app_metadata?.provider === 'google' || hasGoogleIdentity;
        
        if (isGoogleOAuth) {
          // 구글 OAuth의 경우: user_metadata에서 약관 동의 정보 확인 (3개 약관 모두 확인)
          const hasTermsInMetadata = checkUserTermsFromMetadata(user);
          
          if (hasTermsInMetadata) {
            // user_metadata에 약관 동의 정보가 있으면 DB 확인 생략하고 바로 성공 처리
            return NextResponse.redirect(`${origin}${next}`);
          } else {
            // 약관 동의 정보가 없으면 약관 동의 페이지로 리다이렉트
            return NextResponse.redirect(`${origin}/auth/terms/google`);
          }
        }

        // 그 외의 경우(이메일/기타 프로바이더)는 콜백에서는 홈/다음 경로로 이동
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
      console.error('Session exchange error:', error);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}