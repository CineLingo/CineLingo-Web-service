"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
 
import { createClient } from "@/lib/supabase/client";

function EmailConfirmedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processEmailConfirmation = async () => {
      try {
        // 구 링크 호환: token_hash/type이 있으면 /auth/confirm로 서버 처리 위임
        const tokenHash = searchParams.get('token_hash');
        const otpType = searchParams.get('type');
        if (tokenHash && otpType) {
          window.location.replace(`/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(otpType)}`);
          return;
        }

        const supabase = createClient();
        // 세션이 있을 수도, 없을 수도 있음. 이 페이지는 안내 전용으로 단순화
        await supabase.auth.getUser();
        setIsProcessing(false);
        
        // 3초 카운트다운 후 자동 리다이렉트
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              setIsRedirecting(true);
              setTimeout(() => {
                // 페이지 새로고침하여 상단바 상태 즉시 반영
                window.location.href = "/";
              }, 0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
        
      } catch {
        setError('이메일 인증 처리 중 오류가 발생했습니다.');
        setIsProcessing(false);
      }
    };

    processEmailConfirmation();
  }, [router, searchParams]);

  const handleManualRedirect = () => {
    setIsRedirecting(true);
    // 페이지 새로고침하여 상단바 상태 즉시 반영
    window.location.href = "/";
  };

  if (isProcessing) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        
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
        
        <div className="w-full max-w-md">
          <Card className="text-center">
            <CardHeader>
              <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-left text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                <p className="text-sm font-medium">이메일 인증이 끝났다면 로그인해 주세요</p>
                <p className="mt-1 text-xs leading-relaxed">
                  메일 앱이나 외부 브라우저에서 인증해도 괜찮습니다. 로그인하면 가입이 마무리됩니다.
                </p>
              </div>
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

export default function EmailConfirmedPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        
        <div className="w-full max-w-md">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">
                로딩 중...
              </CardTitle>
              <CardDescription className="text-base">
                페이지를 불러오는 중입니다.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <EmailConfirmedContent />
    </Suspense>
  );
}
