'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function GoogleAuthButton() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    // 이메일 회원가입 관련 sessionStorage 정리
    sessionStorage.removeItem("tempSignupType");
    sessionStorage.removeItem("tempSignupEmail");
    sessionStorage.removeItem("tempSignupPassword");
    sessionStorage.removeItem("tempSignupRepeatPassword");
    sessionStorage.removeItem("tempAgreedToTerms");
    sessionStorage.removeItem("tempAgreedToVoice");
    sessionStorage.removeItem("tempAgreedToCopyright");
    sessionStorage.removeItem("tempAgreedToAI");
    
    // redirectTo 쿼리 파라미터 확인
    const redirectTo = searchParams.get('redirectTo');
    
    // 현재 도메인을 기반으로 콜백 URL 생성
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    
    // redirectTo가 있으면 콜백 URL에 쿼리 파라미터로 전달
    const callbackUrl = redirectTo 
      ? `${baseUrl}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
      : `${baseUrl}/auth/callback`;
    
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      });
    } catch (error) {
      // 실패 시 다시 클릭 가능하도록 복구
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" disabled={isLoading} aria-busy={isLoading} className="w-full border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-blue-700 dark:text-blue-300 dark:border-blue-700 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300" onClick={handleSignIn}>
      <FcGoogle className="mr-2 h-4 w-4" />
      {isLoading ? '구글로 이동 중...' : '구글로 계속하기'}
    </Button>
  );
}
