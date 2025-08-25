"use client";

import { TermsAgreementForm } from "./terms-agreement-form";
import { useRouter } from "next/navigation";

export function EmailTermsForm() {
  const router = useRouter();

  const handleTermsComplete = async (termsData: {
    terms_agreed: boolean;
    voice_agreed: boolean;
    copyright_agreed: boolean;
    ai_agreed: boolean;
  }) => {
    try {
      // sessionStorage에 약관 동의 정보 저장 (회원가입 페이지에서 사용)
      sessionStorage.setItem("tempAgreedToTerms", "true");
      sessionStorage.setItem("tempAgreedToVoice", "true");
      sessionStorage.setItem("tempAgreedToCopyright", "true");
      sessionStorage.setItem("tempAgreedToAI", termsData.ai_agreed.toString());
      
      // 이메일 회원가입 과정에서는 아직 로그인하지 않은 상태이므로
      // updateUser 호출을 제거하고 sessionStorage만 사용
      // 실제 약관 동의 정보는 회원가입 시 user_metadata에 저장됨
      
      // 회원가입 페이지로 이동
      router.push("/auth/sign-up");
    } catch (error) {
      console.error('약관 동의 처리 오류:', error);
    }
  };

  return (
    <TermsAgreementForm
      title="이메일 회원가입 - 약관 동의"
      description="CineLingo 서비스 이용을 위한 약관에 동의해주세요"
      onComplete={handleTermsComplete}
    />
  );
}
