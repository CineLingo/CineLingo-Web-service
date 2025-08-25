"use client";

import { GoogleTermsForm } from "@/components/google-terms-form";
import { Suspense } from "react";
import { Loading } from "@/components/ui/loading";

export default function GoogleTermsPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl">
        <Suspense fallback={<Loading text="약관 동의 페이지 로딩 중..." />}>
          <GoogleTermsForm />
        </Suspense>
      </div>
    </div>
  );
}
