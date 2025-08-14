import { LoginForm } from "@/components/login-form";
import HomeButton from "@/components/home-button";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <HomeButton variant="floating" />
      <div className="w-full max-w-sm">
        <Suspense fallback={<div>로딩 중...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
