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
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { GoogleAuthButton } from "@/components/google-auth-button";

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
  // const searchParams = useSearchParams();

  // 세션스토리지에서 약관 동의 데이터 확인
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToVoice, setAgreedToVoice] = useState(false);
  const [agreedToCopyright, setAgreedToCopyright] = useState(false);
  const [agreedToAI, setAgreedToAI] = useState(false);
  // const [signupType, setSignupType] = useState<string | null>(null);

  // 세션스토리지에서 회원가입 데이터 가져오기
  useEffect(() => {
    const storedEmail = sessionStorage.getItem("tempSignupEmail");
    const storedPassword = sessionStorage.getItem("tempSignupPassword");
    const storedRepeatPassword = sessionStorage.getItem("tempSignupRepeatPassword");
    // const storedSignupType = sessionStorage.getItem("tempSignupType");
    const storedAgreedToTerms = sessionStorage.getItem("tempAgreedToTerms");
    const storedAgreedToVoice = sessionStorage.getItem("tempAgreedToVoice");
    const storedAgreedToCopyright = sessionStorage.getItem("tempAgreedToCopyright");
    const storedAgreedToAI = sessionStorage.getItem("tempAgreedToAI");
    
    if (storedEmail) setEmail(storedEmail);
    if (storedPassword) setPassword(storedPassword);
    if (storedRepeatPassword) setRepeatPassword(storedRepeatPassword);
    // if (storedSignupType) setSignupType(storedSignupType);
    if (storedAgreedToTerms === "true") setAgreedToTerms(true);
    if (storedAgreedToVoice === "true") setAgreedToVoice(true);
    if (storedAgreedToCopyright === "true") setAgreedToCopyright(true);
    if (storedAgreedToAI === "true") setAgreedToAI(true);

    // 페이지를 벗어날 때(언마운트) 약관 동의 임시 상태 초기화
    return () => {
      sessionStorage.removeItem("tempAgreedToTerms");
      sessionStorage.removeItem("tempAgreedToVoice");
      sessionStorage.removeItem("tempAgreedToCopyright");
      sessionStorage.removeItem("tempAgreedToAI");
    };
  }, []);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // 약관 동의 확인
    if (!agreedToTerms || !agreedToVoice || !agreedToCopyright) {
      setError("필수 약관에 동의해주세요.");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("비밀번호가 일치하지 않습니다");
      setIsLoading(false);
      return;
    }

    try {
      // 현재 도메인을 기반으로 리다이렉트 URL 생성
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const redirectUrl = `${baseUrl}/auth/email-confirmed`;
        
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
      
      if (error) {
        throw error;
      }

      // 회원가입 성공 시 세션스토리지 정리
      sessionStorage.removeItem("tempSignupEmail");
      sessionStorage.removeItem("tempSignupPassword");
      sessionStorage.removeItem("tempSignupRepeatPassword");
      sessionStorage.removeItem("tempSignupType");
      sessionStorage.removeItem("tempAgreedToTerms");
      sessionStorage.removeItem("tempAgreedToVoice");
      sessionStorage.removeItem("tempAgreedToCopyright");
      sessionStorage.removeItem("tempAgreedToAI");

      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // 약관 동의 상태 초기화 및 약관 페이지로 이동
  const handleResetTerms = () => {
    // 현재 입력값 보존 (다시 돌아왔을 때 이어서 입력 가능)
    sessionStorage.setItem("tempSignupEmail", email);
    sessionStorage.setItem("tempSignupPassword", password);
    sessionStorage.setItem("tempSignupRepeatPassword", repeatPassword);
    sessionStorage.setItem("tempSignupType", "email");

    // 약관 동의 임시 상태 초기화
    sessionStorage.removeItem("tempAgreedToTerms");
    sessionStorage.removeItem("tempAgreedToVoice");
    sessionStorage.removeItem("tempAgreedToCopyright");
    sessionStorage.removeItem("tempAgreedToAI");

    setAgreedToTerms(false);
    setAgreedToVoice(false);
    setAgreedToCopyright(false);
    setAgreedToAI(false);

    // 약관 페이지로 이동
    router.push("/auth/terms/email-signup");
  };


  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {!agreedToTerms || !agreedToVoice || !agreedToCopyright
              ? "회원가입" 
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
                  구글 회원가입은 바로 진행되며, 이메일 회원가입은 약관 동의 후 진행됩니다
                </p>
              </div>
              
              {/* 이메일 회원가입 버튼 */}
              <Button 
                type="button" 
                onClick={async () => {
                  // 세션스토리지에 데이터 저장
                  sessionStorage.setItem("tempSignupEmail", email);
                  sessionStorage.setItem("tempSignupPassword", password);
                  sessionStorage.setItem("tempSignupRepeatPassword", repeatPassword);
                  sessionStorage.setItem("tempSignupType", "email");
                  
                  // 약관 동의 페이지로 이동 (URL 파라미터 없이)
                  router.push("/auth/terms/email-signup");
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                이메일로 회원가입
              </Button>
              
              {/* 구글 회원가입 버튼 - 로그인과 동일한 GoogleAuthButton 사용 */}
              <GoogleAuthButton />
            </div>
          ) : (
            // 약관 동의 후: 실제 회원가입 폼
            <div className="space-y-4">
              {/* 약관 동의 완료 알림 및 재동의 버튼 */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      ✓ 약관에 동의하셨습니다
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetTerms}
                    className="text-xs h-8 px-3 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800"
                  >
                    약관 다시 보기
                  </Button>
                </div>
              </div>
              
              <form onSubmit={handleEmailSignUp}>
                <div className="flex flex-col gap-6">
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
                      <Label htmlFor="repeatPassword">비밀번호 확인</Label>
                    </div>
                    <Input
                      id="repeatPassword"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                  </div>
                  
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                  >
                    {isLoading ? "처리 중..." : "회원가입"}
                  </Button>
                </div>
              </form>
            </div>
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
