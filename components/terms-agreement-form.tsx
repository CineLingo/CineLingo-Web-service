"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface TermsData {
  email: string;
  password: string;
  repeatPassword: string;
}

export function TermsAgreementForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToVoice, setAgreedToVoice] = useState(false);
  const [agreedToCopyright, setAgreedToCopyright] = useState(false);
  const [agreedToAI, setAgreedToAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터에서 회원가입 데이터 가져오기
  const email = searchParams.get("email") || "";
  const password = searchParams.get("password") || "";
  const repeatPassword = searchParams.get("repeatPassword") || "";
  const signupType = searchParams.get("signupType") || "email";

  const handleContinue = async () => {
    setError(null);

    if (!agreedToTerms) {
      setError("이용약관 및 개인정보 수집·이용에 동의해주세요.");
      return;
    }

    if (!agreedToVoice) {
      setError("음성(민감정보)의 수집·활용에 동의해주세요.");
      return;
    }

    if (!agreedToCopyright) {
      setError("창작 또는 공유 가능한 목소리만 업로드한다는 약관에 동의해주세요.");
      return;
    }

    // 회원가입 페이지로 데이터와 함께 이동
    const params = new URLSearchParams({
      email,
      password,
      repeatPassword,
      agreedToTerms: "true",
      agreedToVoice: "true",
      agreedToCopyright: "true",
      agreedToAI: agreedToAI.toString(),
      signupType,
    });

    router.push(`/auth/sign-up?${params.toString()}`);
  };

  const handleBack = () => {
    // 회원가입 페이지로 돌아가기
    const params = new URLSearchParams({
      email,
      password,
      repeatPassword,
      signupType,
    });
    router.push(`/auth/sign-up?${params.toString()}`);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {signupType === "google" ? "구글 회원가입 - 약관 동의" : "이메일 회원가입 - 약관 동의"}
          </CardTitle>
          <CardDescription>
            CineLingo 서비스 이용을 위한 약관에 동의해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {/* 모두 동의하기/취소하기 버튼 */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const allAgreed = agreedToTerms && agreedToVoice && agreedToCopyright && agreedToAI;
                  if (allAgreed) {
                    // 모두 동의된 상태면 모두 취소
                    setAgreedToTerms(false);
                    setAgreedToVoice(false);
                    setAgreedToCopyright(false);
                    setAgreedToAI(false);
                  } else {
                    // 하나라도 동의되지 않은 상태면 모두 동의
                    setAgreedToTerms(true);
                    setAgreedToVoice(true);
                    setAgreedToCopyright(true);
                    setAgreedToAI(true);
                  }
                }}
                className="w-full border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-blue-700 dark:text-blue-300 dark:border-blue-700 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300"
              >
                {agreedToTerms && agreedToVoice && agreedToCopyright && agreedToAI ? "모두 취소하기" : "모두 동의하기"}
              </Button>
            </div>

            {/* 1. 이용약관 및 개인정보 수집·이용 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="terms" className="text-sm font-medium">
                  1. 이용약관 및 개인정보 수집·이용에 동의합니다. <span className="text-red-500">(필수)</span>
                </Label>
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
              </div>
              <div className="max-h-40 overflow-y-auto rounded-md border p-3 text-sm text-muted-foreground">
                <h4 className="font-medium mb-2">이용약관 및 개인정보 수집·이용</h4>
                <p className="text-xs leading-relaxed">
                  서비스 이용을 위해, 회원은 본인의 개인정보(이메일, 접속 기록 등)의 수집 및 이용에 동의합니다.<br/><br/>
                  수집된 정보는 아래의 목적에 한해 사용됩니다:<br/>
                  • 회원 식별 및 로그인 기능 제공<br/>
                  • 서비스 이용 통계 및 품질 개선<br/>
                  • 콘텐츠 생성 이력 저장 및 운영 대응<br/><br/>
                  수집 항목: 이메일 주소, 접속 IP, 브라우저 정보, 음성 생성 요청 로그 등<br/>
                  보유 기간: 회원 탈퇴 시까지 또는 관련 법령에 따른 보존 기간까지<br/><br/>
                  사용자는 언제든지 개인정보 열람·정정·삭제·처리정지 등을 요청할 수 있습니다.<br/>
                  자세한 사항은 개인정보 처리방침을 따릅니다.
                </p>
              </div>
            </div>

            {/* 2. 음성(민감정보)의 수집·활용 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="voice" className="text-sm font-medium">
                  2. 음성(민감정보)의 수집·활용에 동의합니다. <span className="text-red-500">(필수)</span>
                </Label>
                <Checkbox
                  id="voice"
                  checked={agreedToVoice}
                  onCheckedChange={(checked) => setAgreedToVoice(checked as boolean)}
                />
              </div>
              <div className="max-h-40 overflow-y-auto rounded-md border p-3 text-sm text-muted-foreground">
                <h4 className="font-medium mb-2">음성(민감정보)의 수집·활용</h4>
                <p className="text-xs leading-relaxed">
                  본 서비스는 사용자가 업로드한 음성을 기반으로 음성 합성 기능을 제공합니다.<br/>
                  음성 정보는 「개인정보 보호법」 제23조에 따라 <strong>민감정보(생체정보)</strong>에 해당할 수 있으며, 다음과 같은 조건으로 수집·처리됩니다:<br/><br/>
                  • 수집 목적: 음성 합성 기능 제공 및 사용자 중심의 음성 콘텐츠 관리 기능 제공<br/>
                  • 활용 범위: 업로드한 음성은 생성 기능을 위해 일시적으로 참조되며, 사용자의 설정에 따라 콘텐츠 형태로 공개·공유·삭제·보관할 수 있습니다.<br/><br/>
                  사용자에게는 자신이 업로드한 음성에 대한 관리 권한이 부여되며, 마이페이지 등에서 다음과 같은 기능을 직접 수행할 수 있습니다:<br/>
                  • 음성의 공개/비공개 설정<br/>
                  • 음성의 영구 삭제 또는 복원 요청<br/>
                  • 배포 중단 또는 공유 취소 요청<br/><br/>
                  다만, 사용자가 공개로 설정한 음성은 제3자에게 공유되거나 사용될 수 있으므로, 이에 대한 선택은 신중하게 진행해 주시기 바랍니다.<br/><br/>
                  회사는 사용자의 요청 또는 법적 의무에 따라, 콘텐츠를 삭제·비공개 처리할 수 있으며, 비공개 전환 시 공유 기능도 중단됩니다.
                </p>
              </div>
            </div>

            {/* 3. 창작 또는 공유 가능한 목소리만 업로드 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="copyright" className="text-sm font-medium">
                  3. 창작 또는 공유 가능한 목소리만 업로드합니다. <span className="text-red-500">(필수)</span>
                </Label>
                <Checkbox
                  id="copyright"
                  checked={agreedToCopyright}
                  onCheckedChange={(checked) => setAgreedToCopyright(checked as boolean)}
                />
              </div>
              <div className="max-h-40 overflow-y-auto rounded-md border p-3 text-sm text-muted-foreground">
                <h4 className="font-medium mb-2">창작 또는 공유 가능한 목소리만 업로드</h4>
                <p className="text-xs leading-relaxed">
                  본 서비스는 누구나 음성을 업로드하고 생성 결과를 확인할 수 있는 열린 플랫폼입니다.<br/>
                  이에 따라 사용자는 다음 사항에 동의합니다:<br/><br/>
                  • 본인의 음성 또는 타인의 음성을 동의 하에 업로드해야 하며,<br/>
                  • 방송인, 연예인 등 제3자의 퍼블리시티권이 침해되지 않도록 주의해야 합니다.<br/>
                  • 저작권·초상권·퍼블리시티권을 포함한 타인의 권리를 침해한 경우, 모든 민·형사상 책임은 사용자에게 있으며, 회사는 이에 대한 책임을 지지 않습니다.<br/><br/>
                  타인의 권리가 침해되었다는 신고가 접수된 경우, 회사는 사전 고지 없이 해당 콘텐츠를 삭제하거나 이용을 제한할 수 있습니다.
                </p>
              </div>
            </div>

            {/* 4. AI 학습 활용 (선택사항) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="ai" className="text-sm font-medium">
                  4. 업로드한 음성/텍스트가 AI 학습에 활용될 수 있음에 동의합니다. <span className="text-gray-500">(선택)</span>
                </Label>
                <Checkbox
                  id="ai"
                  checked={agreedToAI}
                  onCheckedChange={(checked) => setAgreedToAI(checked as boolean)}
                />
              </div>
              <div className="max-h-40 overflow-y-auto rounded-md border p-3 text-sm text-muted-foreground">
                <h4 className="font-medium mb-2">AI 학습 활용 동의</h4>
                <p className="text-xs leading-relaxed">
                  사용자가 제공한 음성 및 입력한 텍스트는 당사의 AI 모델 품질 개선을 위한 학습 데이터로 활용될 수 있습니다.<br/>
                  단, 본 활용은 사용자의 선택 동의가 있는 경우에만 이루어지며, 다음과 같은 조건을 따릅니다:<br/><br/>
                  • 수집 항목: 업로드된 음성 파일, 입력된 텍스트 문장<br/>
                  • 활용 목적: AI 모델의 음성 합성 품질 개선 및 연구<br/>
                  • 활용 방식: 비식별화된 데이터로 가공하여 내부 학습에만 사용<br/>
                  • 보유 기간: 활용 목적 달성 시까지, 또는 사용자의 삭제 요청 시<br/><br/>
                  동의하지 않아도 서비스 이용에는 전혀 제한이 없습니다.
                </p>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                이전
              </Button>
              <Button
                type="button"
                onClick={handleContinue}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? "처리 중..." : "다음"}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                약관에 동의하지 않으시면 서비스를 이용할 수 없습니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 