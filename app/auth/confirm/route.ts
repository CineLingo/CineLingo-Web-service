import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    if (!error) {
      // 이메일 인증 완료 후 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // email_verified를 true로 업데이트
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            email_verified: true
          }
        });

        if (updateError) {
          console.error('이메일 인증 상태 업데이트 오류:', updateError);
        }

        // 약관 동의 여부 확인 (사용하지 않는 변수 주석 처리)
        // const termsAgreed = user.user_metadata?.terms_agreed === true || 
        //                    user.user_metadata?.terms_agreed === 'true' || 
        //                    user.user_metadata?.terms_agreed === '1';
        // const voiceAgreed = user.user_metadata?.voice_agreed === true || 
        //                    user.user_metadata?.voice_agreed === 'true' || 
        //                    user.user_metadata?.voice_agreed === '1';
        // const copyrightAgreed = user.user_metadata?.copyright_agreed === true || 
        //                        user.user_metadata?.copyright_agreed === 'true' || 
        //                        user.user_metadata?.copyright_agreed === '1';
        
        // 이메일 인증 완료 페이지로 리다이렉트 (public 테이블 생성은 email-confirmed 페이지에서 처리)
        redirect('/auth/email-confirmed');
      } else {
        redirect(`/auth/error?error=사용자 정보를 찾을 수 없습니다`);
      }
    } else {
      redirect(`/auth/error?error=이메일 인증에 실패했습니다: ${error.message}`);
    }
  } else {
    // redirect the user to an error page with some instructions
    redirect(`/auth/error?error=No token hash or type`);
  }
}
