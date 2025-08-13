'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
import { useSearchParams } from 'next/navigation';

export function GoogleAuthButton() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const handleSignIn = async () => {
    // redirectTo 쿼리 파라미터 확인
    const redirectTo = searchParams.get('redirectTo');
    
    // 환경 변수에서 기본 URL을 가져오거나, 개발 환경에서는 localhost 사용
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    // redirectTo가 있으면 콜백 URL에 쿼리 파라미터로 전달
    const callbackUrl = redirectTo 
      ? `${baseUrl}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
      : `${baseUrl}/auth/callback`;
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        // 약관 동의 정보는 전달하지 않음 - 콜백에서 약관 동의 페이지로 리다이렉트
      },
    });
  };

  return (
    <Button variant="outline" className="w-full border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-blue-700 dark:text-blue-300 dark:border-blue-700 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300" onClick={handleSignIn}>
      <FcGoogle className="mr-2 h-4 w-4" />
      구글로 계속하기
    </Button>
  );
}
