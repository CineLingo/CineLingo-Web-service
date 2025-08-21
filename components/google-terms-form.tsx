"use client";

import { TermsAgreementForm } from "./terms-agreement-form";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function GoogleTermsForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const handleTermsComplete = async (termsData: {
    terms_agreed: boolean;
    voice_agreed: boolean;
    copyright_agreed: boolean;
    ai_agreed: boolean;
  }) => {
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

      const response = await fetch('/api/terms/complete', {
        method: 'POST',
        body: formData,
      });

      if (response.redirected) {
        window.location.href = response.url;
      } else {
        const result = await response.json();
        if (!result.success) {
          setError(result.error || "약관 동의 처리에 실패했습니다.");
        }
      }
    } catch {
      setError("약관 동의 처리 중 오류가 발생했습니다.");
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
