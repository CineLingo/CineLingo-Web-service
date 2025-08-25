"use client";

import { GoogleTermsForm } from "@/components/google-terms-form";
import { Suspense } from "react";
import { Loading } from "@/components/ui/loading";

export default function GoogleTermsPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loading text="약관 동의 페이지 로딩 중..." />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              잠시만 기다려주세요...
            </p>
          </div>
        }>
          <GoogleTermsForm />
        </Suspense>
      </div>
    </div>
  );
}
