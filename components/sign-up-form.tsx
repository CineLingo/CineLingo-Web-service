"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { FcGoogle } from 'react-icons/fc';

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터에서 약관 동의 데이터 확인
  const agreedToTerms = searchParams.get("agreedToTerms") === "true";
  const agreedToVoice = searchParams.get("agreedToVoice") === "true";
  const agreedToCopyright = searchParams.get("agreedToCopyright") === "true";
  const agreedToAI = searchParams.get("agreedToAI") === "true";
  const signupType = searchParams.get("signupType"); // "email" 또는 "google"

  // URL 파라미터에서 회원가입 데이터 가져오기
  useEffect(() => {
    const urlEmail = searchParams.get("email");
    const urlPassword = searchParams.get("password");
    const urlRepeatPassword = searchParams.get("repeatPassword");
    
    if (urlEmail) setEmail(urlEmail);
    if (urlPassword) setPassword(urlPassword);
    if (urlRepeatPassword) setRepeatPassword(urlRepeatPassword);
  }, [searchParams]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    console.log('=== 회원가입 시작 ===');
    console.log('약관 동의 상태:', {
      agreedToTerms,
      agreedToVoice,
      agreedToCopyright,
      agreedToAI,
      signupType
    });

    // 약관 동의 확인
    if (!agreedToTerms || !agreedToVoice || !agreedToCopyright) {
      console.log('약관 동의 실패 - 필수 약관 미동의');
      setError("필수 약관에 동의해주세요.");
      setIsLoading(false);
      return;
    }

    console.log('약관 동의 확인 완료');

    if (password !== repeatPassword) {
      setError("비밀번호가 일치하지 않습니다");
      setIsLoading(false);
      return;
    }

    try {
      // 환경 변수에서 기본 URL을 가져오거나, 개발 환경에서는 localhost 사용
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
        (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      const redirectUrl = `${baseUrl}/upload`;
        
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            // 약관 동의 정보를 메타데이터에 저장
            terms_agreed: agreedToTerms,
            voice_agreed: agreedToVoice,
            copyright_agreed: agreedToCopyright,
            ai_agreed: agreedToAI
          }
        },
      });
      if (error) throw error;

      // Database Functions에서 자동으로 모든 테이블에 삽입됨 (users, accounts, user_to_account_mapping, terms_agreement)
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    // 구글 회원가입 로직은 약관 동의 후 처리
    if (!agreedToTerms || !agreedToVoice || !agreedToCopyright) {
      setError("필수 약관에 동의해주세요.");
      return;
    }
    
    // 구글 인증 처리 (약관 동의 정보를 메타데이터에 포함)
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          // 약관 동의 정보를 쿼리 파라미터로 전달
          terms_agreed: agreedToTerms.toString(),
          voice_agreed: agreedToVoice.toString(),
          copyright_agreed: agreedToCopyright.toString(),
          ai_agreed: agreedToAI.toString()
        }
      },
    });
    
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {!agreedToTerms || !agreedToVoice || !agreedToCopyright
              ? "회원가입" 
              : signupType === "google" 
                ? "구글 회원가입" 
                : "이메일 회원가입"
            }
          </CardTitle>
          <CardDescription>
            {!agreedToTerms || !agreedToVoice || !agreedToCopyright
              ? "새로운 계정을 만들어보세요" 
              : "약관에 동의하셨습니다. 회원가입을 완료해주세요."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!agreedToTerms || !agreedToVoice || !agreedToCopyright ? (
            // 약관 동의 전: 회원가입 방법 선택
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">회원가입 방법을 선택해주세요</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  계정을 만든 후 약관에 동의하시면 됩니다
                </p>
              </div>
              
              {/* 이메일 회원가입 버튼 */}
              <Button 
                type="button" 
                onClick={() => {
                  const params = new URLSearchParams({
                    email,
                    password,
                    repeatPassword,
                    signupType: "email",
                  });
                  router.push(`/auth/terms?${params.toString()}`);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                이메일로 회원가입
              </Button>
              
              {/* 구글 회원가입 버튼 */}
              <Button 
                type="button" 
                onClick={() => {
                  const params = new URLSearchParams({
                    signupType: "google",
                  });
                  router.push(`/auth/terms?${params.toString()}`);
                }}
                variant="outline"
                className="w-full border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-blue-700 dark:text-blue-300 dark:border-blue-700 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300"
              >
                <FcGoogle className="mr-2 h-4 w-4" />
                구글로 계속하기
              </Button>
            </div>
          ) : (
            // 약관 동의 후: 실제 회원가입 폼
            <form onSubmit={handleEmailSignUp}>
              <div className="flex flex-col gap-6">
                {signupType === "email" && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="email">이메일</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="password">비밀번호</Label>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="repeat-password">비밀번호 확인</Label>
                      </div>
                      <Input
                        id="repeat-password"
                        type="password"
                        required
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                      />
                    </div>
                  </>
                )}
                
                {error && <p className="text-sm text-red-500">{error}</p>}
                
                {/* 약관 동의 상태 표시 */}
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                  ✓ 약관에 동의하셨습니다
                </div>
                
                {signupType === "email" ? (
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300" disabled={isLoading}>
                    {isLoading ? "계정 생성 중..." : "이메일로 회원가입"}
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={handleGoogleSignUp}
                    variant="outline"
                    className="w-full border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-blue-700 dark:text-blue-300 dark:border-blue-700 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300"
                  >
                    <FcGoogle className="mr-2 h-4 w-4" />
                    구글로 계속하기
                  </Button>
                )}
              </div>
            </form>
          )}
          
          <div className="mt-4 text-center text-sm">
            이미 계정이 있으신가요?{" "}
            <Link href="/auth/login" className="underline underline-offset-4">
              로그인
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
