import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
 

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                이메일 인증이 필요합니다
              </CardTitle>
              <CardDescription>가입하신 이메일 주소로 인증 메일을 발송했습니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  이메일함을 확인하여 인증 링크를 클릭해주세요. 인증이 완료되면 로그인이 가능합니다.
                </p>
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                  <p className="text-sm font-medium">
                    동일한 브라우저에서 인증을 완료해주세요
                  </p>
                  <p className="mt-1 text-xs leading-relaxed">
                    예) 아이폰에서 크롬으로 회원가입을 시작했다면, <strong>같은 크롬 앱</strong>에서 네이버 메일에 로그인한 뒤 인증 메일의 링크를 눌러주세요. 다른 앱(사파리/네이버앱 등)으로 열면 인증이 실패할 수 있어요.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
