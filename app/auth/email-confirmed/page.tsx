"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
 
import { createClient } from "@/lib/supabase/client";
import { type EmailOtpType } from "@supabase/supabase-js";

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
        const supabase = createClient();
        
        // URL 파라미터에서 토큰 정보 확인
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        // 토큰이 있는 경우 이메일 인증 처리
        if (tokenHash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: type as EmailOtpType,
            token_hash: tokenHash,
          });
          
          if (verifyError) {
            setError(`이메일 인증에 실패했습니다: ${verifyError.message}`);
            setIsProcessing(false);
            return;
          }
          
          // 이메일 인증 완료 후 잠시 대기 (auth.users 테이블 업데이트 대기)
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 사용자 정보 가져오기
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setError('사용자 정보를 가져올 수 없습니다.');
          setIsProcessing(false);
          return;
        }
        
        // 이메일 인증 상태 확인
        if (!user.email_confirmed_at) {
          // 잠시 더 대기 후 다시 확인
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { data: { user: refreshedUser }, error: refreshError } = await supabase.auth.getUser();
          if (refreshError || !refreshedUser) {
            setError('사용자 정보를 새로고침할 수 없습니다.');
            setIsProcessing(false);
            return;
          }
          
          if (!refreshedUser.email_confirmed_at) {
            setError('이메일 인증이 완료되지 않았습니다. 다시 시도해주세요.');
            setIsProcessing(false);
            return;
          }
        }
        
        // 약관 동의 여부 확인 (user_metadata에서 확인)
        const termsAgreed = user.user_metadata?.terms_agreed === true || 
                           user.user_metadata?.terms_agreed === 'true' || 
                           user.user_metadata?.terms_agreed === '1';
        const voiceAgreed = user.user_metadata?.voice_agreed === true || 
                           user.user_metadata?.voice_agreed === 'true' || 
                           user.user_metadata?.voice_agreed === '1';
        const copyrightAgreed = user.user_metadata?.copyright_agreed === true || 
                               user.user_metadata?.copyright_agreed === 'true' || 
                               user.user_metadata?.copyright_agreed === '1';
        const aiAgreed = user.user_metadata?.ai_agreed === true || 
                        user.user_metadata?.ai_agreed === 'true' || 
                        user.user_metadata?.ai_agreed === '1';
        
        // 이메일 인증이 완료되고 약관 동의가 완료된 경우 public 테이블 생성
        if (user.email_confirmed_at && termsAgreed && voiceAgreed && copyrightAgreed) {
          try {
            // 1. users 테이블에 insert
            const { error: usersError } = await supabase
              .from('users')
              .upsert({
                user_id: user.id,
                email: user.email,
                display_name: '',
                avatar_url: '',
                auth_provider: true,
                balance: 0
              }, { onConflict: 'user_id' });
            
            if (usersError) {
              throw new Error(`users 테이블 생성 실패: ${usersError.message}`);
            }
            
            // 2. accounts 테이블에 insert
            const { error: accountsError } = await supabase
              .from('accounts')
              .upsert({
                email: user.email,
                name: '',
                usage: 0.0
              }, { onConflict: 'email' });
            
            if (accountsError) {
              throw new Error(`accounts 테이블 생성 실패: ${accountsError.message}`);
            }
            
            // 3. account_id 가져오기
            const { data: accountData, error: accountQueryError } = await supabase
              .from('accounts')
              .select('account_id')
              .eq('email', user.email)
              .single();
            
            if (accountQueryError || !accountData) {
              throw new Error(`account_id 조회 실패: ${accountQueryError?.message || 'account_id를 찾을 수 없습니다'}`);
            }
            
            const accountId = accountData.account_id;
            
            // 4. user_to_account_mapping 테이블에 insert
            const { error: mappingError } = await supabase
              .from('user_to_account_mapping')
              .upsert({
                user_id: user.id,
                account_id: accountId
              }, { onConflict: 'user_id,account_id' });
            
            if (mappingError) {
              throw new Error(`user_to_account_mapping 테이블 생성 실패: ${mappingError.message}`);
            }
            
            // 5. terms_agreement 테이블에 insert
            const { error: termsError } = await supabase
              .from('terms_agreement')
              .upsert({
                account_id: accountId,
                terms_version: '1.0',
                agreed: true,
                critical_keys: {
                  terms_agreed: termsAgreed,
                  voice_agreed: voiceAgreed,
                  copyright_agreed: copyrightAgreed,
                  ai_agreed: aiAgreed
                }
              }, { onConflict: 'account_id' });
            
            if (termsError) {
              throw new Error(`terms_agreement 테이블 생성 실패: ${termsError.message}`);
            }
            
            // 6. 사용자 메타데이터 업데이트 (미들웨어에서 약관 동의 상태 확인을 위해)
            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                terms_agreed: true,
                voice_agreed: true,
                copyright_agreed: true,
                ai_agreed: aiAgreed
              }
            });
            
            if (updateError) {
              throw new Error(`사용자 메타데이터 업데이트 실패: ${updateError.message}`);
            }
            
            // 7. 세션 새로고침
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.warn('세션 새로고침 실패:', refreshError.message);
            }
            
          } catch (error) {
            setError(`회원가입 완료에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
            setIsProcessing(false);
            return;
          }
        } else if (!user.email_confirmed_at) {
          setError('이메일 인증이 완료되지 않았습니다.');
          setIsProcessing(false);
          return;
        } else {
          setError('약관 동의가 완료되지 않았습니다. 회원가입을 다시 진행해주세요.');
          setIsProcessing(false);
          return;
        }
        
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
                <p className="text-sm font-medium">동일한 브라우저에서 이메일 인증을 완료해주세요</p>
                <p className="mt-1 text-xs leading-relaxed">
                  예) 아이폰에서 크롬으로 회원가입을 시작했다면, <strong>같은 크롬 앱</strong>에서 네이버 메일에 로그인한 뒤 인증 메일의 링크를 눌러주세요. 다른 앱(사파리/네이버앱 등)으로 열면 인증이 실패할 수 있어요.
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
