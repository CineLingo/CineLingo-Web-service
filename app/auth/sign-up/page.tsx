import { SignUpForm } from "@/components/sign-up-form";
import { Suspense } from "react";
import { Loading } from "@/components/ui/loading";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<Loading text="회원가입 페이지 로딩 중..." />}>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
