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
            // 구글 회원가입 시 약관 동의 정보를 사용자 메타데이터에 저장
      if (termsAgreed && voiceAgreed && copyrightAgreed) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
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
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}