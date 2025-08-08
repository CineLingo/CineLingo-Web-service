import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    if (!error) {
      console.log('=== 이메일 인증 완료 처리 시작 ===');
      
      // 이메일 인증 완료 후 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('사용자 정보 확인:', { id: user.id, email: user.email });
        console.log('사용자 메타데이터:', user.user_metadata);

        // email_verified를 true로 업데이트
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            email_verified: true
          }
        });

        if (updateError) {
          console.error('이메일 인증 상태 업데이트 오류:', updateError);
        } else {
          console.log('이메일 인증 상태 업데이트 완료');
        }

        // 약관 동의 여부 확인
        const termsAgreed = user.user_metadata?.terms_agreed === true || 
                           user.user_metadata?.terms_agreed === 'true' || 
                           user.user_metadata?.terms_agreed === '1';
        const voiceAgreed = user.user_metadata?.voice_agreed === true || 
                           user.user_metadata?.voice_agreed === 'true' || 
                           user.user_metadata?.voice_agreed === '1';
        const copyrightAgreed = user.user_metadata?.copyright_agreed === true || 
                               user.user_metadata?.copyright_agreed === 'true' || 
                               user.user_metadata?.copyright_agreed === '1';
        
        console.log('약관 동의 상태:', { termsAgreed, voiceAgreed, copyrightAgreed });
        
        // 약관 동의가 완료된 경우 테이블 생성
        if (termsAgreed && voiceAgreed && copyrightAgreed) {
          console.log('complete_email_signup 함수 호출 시작');
          
          const { data: signupData, error: signupError } = await supabase.rpc('complete_email_signup', {
            user_uuid: user.id
          });
          
          console.log('complete_email_signup 결과:', { data: signupData, error: signupError });
          
          if (signupError) {
            console.error('이메일 회원가입 완료 오류:', signupError);
            redirect(`/auth/error?error=회원가입 완료 중 오류가 발생했습니다: ${signupError.message}`);
          } else if (signupData && signupData.success) {
            console.log('이메일 회원가입 완료 성공');
            // 이메일 인증 완료 페이지로 리다이렉트
            redirect('/auth/email-confirmed');
          } else {
            console.error('이메일 회원가입 완료 실패:', signupData);
            redirect(`/auth/error?error=회원가입 완료에 실패했습니다: ${signupData?.error || '알 수 없는 오류'}`);
          }
        } else {
          console.log('약관 동의가 완료되지 않음 - 이메일 인증 완료 페이지로 이동');
          redirect('/auth/email-confirmed');
        }
      } else {
        console.error('사용자 정보를 찾을 수 없음');
        redirect(`/auth/error?error=사용자 정보를 찾을 수 없습니다`);
      }
    } else {
      console.error('이메일 인증 오류:', error);
      redirect(`/auth/error?error=이메일 인증에 실패했습니다: ${error.message}`);
    }
  } else {
    // redirect the user to an error page with some instructions
    redirect(`/auth/error?error=No token hash or type`);
  }
}
