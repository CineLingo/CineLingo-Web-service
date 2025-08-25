"use client";

import { TermsAgreementForm } from "./terms-agreement-form";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function GoogleTermsForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTermsComplete = async (termsData: {
    terms_agreed: boolean;
    voice_agreed: boolean;
    copyright_agreed: boolean;
    ai_agreed: boolean;
  }) => {
    if (isSubmitting) return; // 중복 제출 방지
    
    setIsSubmitting(true);
    setError(null);

    try {
      // API 호출로 약관 동의 완료
      const formData = new FormData();
      formData.append('terms_agreed', termsData.terms_agreed.toString());
      formData.append('voice_agreed', termsData.voice_agreed.toString());
      formData.append('copyright_agreed', termsData.copyright_agreed.toString());
      formData.append('ai_agreed', termsData.ai_agreed.toString());
      
      const redirectTo = searchParams.get('redirectTo');
      if (redirectTo) {
        formData.append('redirectTo', redirectTo);
      }

      // 최적화: 타임아웃 설정으로 무한 대기 방지
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

      const response = await fetch('/api/terms/complete', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.redirected) {
        window.location.href = response.url;
      } else {
        const result = await response.json();
        if (!result.success) {
          setError(result.error || "약관 동의 처리에 실패했습니다.");
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setError("요청 시간이 초과되었습니다. 다시 시도해주세요.");
      } else {
        setError("약관 동의 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TermsAgreementForm
      title="약관 동의"
      description="서비스 이용을 위해 약관에 동의해주세요"
      onComplete={handleTermsComplete}
      error={error}
    />
  );
}
