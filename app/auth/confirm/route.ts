import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // const next = searchParams.get("next") ?? "/";

  // 1) 코드 교환 플로우 지원 (Supabase가 code 파라미터를 보내는 경우)
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 비밀번호 복구 링크를 통해 들어온 경우, 세션 교환 후 재설정 페이지로 이동
      // 복구가 아닌 일반 이메일 인증 코드일 수도 있으나, code 플로우에서는 타입 정보가 없으므로
      // 복구 플로우를 우선 지원하고, 이메일 인증은 기존 token_hash 플로우로 처리합니다.
      redirect('/auth/update-password');
    } else {
      redirect(`/auth/error?error=코드 교환에 실패했습니다: ${error.message}`);
    }
  }

  // 2) token_hash + type 기반의 전통적인 OTP 검증 플로우
  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    if (!error) {
      // 이메일 인증/복구 완료 후 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 비밀번호 복구 링크인 경우: 비밀번호 재설정 페이지로 이동
        if (type === 'recovery') {
          redirect('/auth/update-password');
        }

        // 이메일 인증의 경우: email_verified 플래그를 true로 업데이트 후 안내 페이지로 이동
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            email_verified: true
          }
        });

        if (updateError) {
          console.error('이메일 인증 상태 업데이트 오류:', updateError);
        }

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
