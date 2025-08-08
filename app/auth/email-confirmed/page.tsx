"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import HomeButton from "@/components/home-button";
import { createClient } from "@/lib/supabase/client";

export default function EmailConfirmedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processEmailConfirmation = async () => {
      try {
        console.log('=== 이메일 인증 완료 페이지 로드 ===');
        
        const supabase = createClient();
        
        // URL 파라미터에서 토큰 정보 확인
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        console.log('URL 파라미터:', { tokenHash, type });
        
        // 토큰이 있는 경우 이메일 인증 처리
        if (tokenHash && type) {
          console.log('이메일 인증 처리 시작');
          
          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: type as any,
            token_hash: tokenHash,
          });
          
          if (verifyError) {
            console.error('이메일 인증 오류:', verifyError);
            setError(`이메일 인증에 실패했습니다: ${verifyError.message}`);
            setIsProcessing(false);
            return;
          }
          
          console.log('이메일 인증 완료');
          
          // 이메일 인증 완료 후 잠시 대기 (auth.users 테이블 업데이트 대기)
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 사용자 정보 가져오기
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('사용자 정보 가져오기 오류:', userError);
          setError('사용자 정보를 가져올 수 없습니다.');
          setIsProcessing(false);
          return;
        }
        
        console.log('사용자 정보 확인:', { id: user.id, email: user.email });
        console.log('사용자 메타데이터:', user.user_metadata);
        
        // 이메일 인증 상태 확인
        if (!user.email_confirmed_at) {
          console.log('이메일 인증이 아직 완료되지 않음, 다시 확인 중...');
          // 잠시 더 대기 후 다시 확인
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { data: { user: refreshedUser }, error: refreshError } = await supabase.auth.getUser();
          if (refreshError || !refreshedUser) {
            console.error('사용자 정보 새로고침 오류:', refreshError);
            setError('사용자 정보를 새로고침할 수 없습니다.');
            setIsProcessing(false);
            return;
          }
          
          if (!refreshedUser.email_confirmed_at) {
            console.error('이메일 인증이 완료되지 않음');
            setError('이메일 인증이 완료되지 않았습니다. 다시 시도해주세요.');
            setIsProcessing(false);
            return;
          }
          
          console.log('이메일 인증 완료 확인됨:', refreshedUser.email_confirmed_at);
        } else {
          console.log('이메일 인증 완료됨:', user.email_confirmed_at);
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
        console.log('전체 user_metadata:', user.user_metadata);
        
        // 이메일 인증이 완료되고 약관 동의가 완료되었는지 확인
        if (user.email_confirmed_at && termsAgreed && voiceAgreed && copyrightAgreed) {
          console.log('✅ 이메일 인증 및 약관 동의 완료 - 회원가입 성공!');
          console.log('📝 Public 테이블은 이미 confirm/route.ts에서 생성되었습니다.');
        } else if (!user.email_confirmed_at) {
          console.log('⚠️ 이메일 인증이 완료되지 않음');
        } else {
          console.log('⚠️ 약관 동의가 완료되지 않음');
        }
        
        console.log('모든 처리 완료');
        setIsProcessing(false);
        
        // 3초 카운트다운 후 자동 리다이렉트
                       const timer = setInterval(() => {
                 setCountdown((prev) => {
                   if (prev <= 1) {
                     setIsRedirecting(true);
                     // setTimeout을 사용하여 렌더링 사이클 밖에서 라우터 이동
                     setTimeout(() => {
                       router.push("/");
                     }, 0);
                     return 0;
                   }
                   return prev - 1;
                 });
               }, 1000);

        return () => clearInterval(timer);
        
      } catch (error) {
        console.error('이메일 인증 처리 중 오류:', error);
        setError('이메일 인증 처리 중 오류가 발생했습니다.');
        setIsProcessing(false);
      }
    };

    processEmailConfirmation();
  }, [router, searchParams]);

  const handleManualRedirect = () => {
    setIsRedirecting(true);
    router.push("/");
  };

  if (isProcessing) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <HomeButton variant="floating" />
        <div className="w-full max-w-md">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">
                이메일 인증 처리 중...
              </CardTitle>
              <CardDescription className="text-base">
                잠시만 기다려주세요.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <HomeButton variant="floating" />
        <div className="w-full max-w-md">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <CheckCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                오류가 발생했습니다
              </CardTitle>
              <CardDescription className="text-base">
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push("/auth/login")}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                로그인 페이지로 이동
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <HomeButton variant="floating" />
      <div className="w-full max-w-md">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">
              이메일 인증이 완료되었습니다!
            </CardTitle>
            <CardDescription className="text-base">
              회원가입이 성공적으로 완료되었습니다.
              <br />
              {countdown > 0 ? (
                <span className="text-sm text-muted-foreground">
                  {countdown}초 후 메인 페이지로 이동합니다...
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  메인 페이지로 이동 중...
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleManualRedirect}
              disabled={isRedirecting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              {isRedirecting ? (
                "이동 중..."
              ) : (
                <>
                  메인 페이지로 이동
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
