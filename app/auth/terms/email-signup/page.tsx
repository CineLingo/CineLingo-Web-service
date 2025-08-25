"use client";

import { EmailTermsForm } from "@/components/email-terms-form";

export default function EmailSignupTermsPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl">
        <EmailTermsForm />
      </div>
    </div>
  );
}
