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
import { useState } from "react";

interface TermsAgreementFormProps {
  title: string;
  description: string;
  onComplete: (termsData: {
    terms_agreed: boolean;
    voice_agreed: boolean;
    copyright_agreed: boolean;
    ai_agreed: boolean;
  }) => void;
  error?: string | null;
  className?: string;
}

export function TermsAgreementForm({ 
  title, 
  description, 
  onComplete, 
  error: propError,
  className,
  ...props 
}: TermsAgreementFormProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToVoice, setAgreedToVoice] = useState(false);
  const [agreedToCopyright, setAgreedToCopyright] = useState(false);
  const [agreedToAI, setAgreedToAI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // prop으로 받은 error와 local error를 결합
  const error = propError || localError;
  // prop으로 받은 isLoading과 local isLoading을 결합
  const isSubmitting = isLoading;

  const handleContinue = async () => {
    if (!agreedToTerms) {
      setLocalError("이용약관 및 개인정보 수집·이용에 동의해주세요.");
      return;
    }

    if (!agreedToVoice) {
      setLocalError("음성(민감정보)의 수집·활용에 동의해주세요.");
      return;
    }

    if (!agreedToCopyright) {
      setLocalError("창작 또는 공유 가능한 목소리만 업로드한다는 약관에 동의해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      onComplete({
        terms_agreed: agreedToTerms,
        voice_agreed: agreedToVoice,
        copyright_agreed: agreedToCopyright,
        ai_agreed: agreedToAI
      });
    } catch (error) {
      console.error('약관 동의 처리 오류:', error);
      // 에러가 발생해도 로딩 상태는 해제
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  3. 창작 또는 공유 가능한 목소리만 업로드한다는 약관에 동의합니다. <span className="text-red-500">(필수)</span>
                </Label>
                <Checkbox
                  id="copyright"
                  checked={agreedToCopyright}
                  onCheckedChange={(checked) => setAgreedToCopyright(checked as boolean)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="max-h-40 overflow-y-auto rounded-md border p-3 text-sm text-muted-foreground">
                <h4 className="font-medium mb-2">창작 또는 공유 가능한 목소리만 업로드</h4>
                <p className="text-xs leading-relaxed">
                  본 서비스는 사용자가 업로드한 음성을 기반으로 AI 음성 합성 기능을 제공합니다.<br/>
                  이 과정에서 업로드되는 음성은 다음과 같은 조건을 충족해야 합니다:<br/><br/>
                  <strong>허용되는 음성:</strong><br/>
                  • 본인이 직접 녹음한 음성<br/>
                  • 본인이 창작한 콘텐츠의 음성<br/>
                  • 공유 및 상업적 이용이 가능한 음성<br/>
                  • 저작권이 본인에게 있거나 적법한 권한이 있는 음성<br/><br/>
                  <strong>금지되는 음성:</strong><br/>
                  • 제3자의 음성 (동의 없이)<br/>
                  • 저작권이 있는 음성 (권한 없이)<br/>
                  • 상업적 이용이 제한된 음성<br/>
                  • 불법적이거나 부적절한 콘텐츠의 음성<br/><br/>
                  사용자는 업로드하는 음성에 대한 모든 권한과 책임을 가집니다.<br/>
                  권리 침해가 발견될 경우, 해당 콘텐츠는 즉시 삭제되며 관련 법적 조치가 취해질 수 있습니다.
                </p>
              </div>
            </div>

            {/* 4. AI 생성 콘텐츠 이용 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="ai" className="text-sm font-medium">
                  4. AI 생성 콘텐츠 이용에 동의합니다. <span className="text-gray-500">(선택)</span>
                </Label>
                <Checkbox
                  id="ai"
                  checked={agreedToAI}
                  onCheckedChange={(checked) => setAgreedToAI(checked as boolean)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="max-h-40 overflow-y-auto rounded-md border p-3 text-sm text-muted-foreground">
                <h4 className="font-medium mb-2">AI 생성 콘텐츠 이용</h4>
                <p className="text-xs leading-relaxed">
                  본 서비스는 AI 기술을 활용하여 사용자가 업로드한 음성을 기반으로 새로운 음성 콘텐츠를 생성합니다.<br/>
                  이 과정에서 생성되는 AI 콘텐츠에 대한 이용 조건은 다음과 같습니다:<br/><br/>
                  <strong>AI 생성 콘텐츠의 특성:</strong><br/>
                  • 업로드된 음성을 학습하여 유사한 음성으로 새로운 콘텐츠를 생성<br/>
                  • 원본 음성과는 다른 새로운 콘텐츠로 간주<br/>
                  • 사용자가 직접 입력한 텍스트를 음성으로 변환<br/><br/>
                  <strong>이용 권한:</strong><br/>
                  • 생성된 AI 콘텐츠는 사용자가 자유롭게 이용 가능<br/>
                  • 상업적 이용, 공유, 배포 등 모든 용도로 사용 가능<br/>
                  • 단, 원본 음성의 저작권은 별도로 보호됨<br/><br/>
                  <strong>주의사항:</strong><br/>
                  • AI 생성 콘텐츠는 원본 음성과 유사할 수 있으나, 완전히 동일하지는 않음<br/>
                  • 생성된 콘텐츠의 품질은 입력된 텍스트와 원본 음성의 품질에 따라 달라질 수 있음<br/>
                  • AI 기술의 한계로 인해 완벽한 음성 합성이 보장되지 않을 수 있음
                </p>
              </div>
            </div>

            {/* 모두 동의하기/취소하기 버튼 */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
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
                disabled={isSubmitting}
              >
                {agreedToTerms && agreedToVoice && agreedToCopyright && agreedToAI ? "모두 취소하기" : "모두 동의하기"}
              </Button>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* 동의 완료 버튼 */}
            <Button
              onClick={handleContinue}
              disabled={isSubmitting || !agreedToTerms || !agreedToVoice || !agreedToCopyright}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              {isSubmitting ? "처리 중..." : "동의 완료"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 