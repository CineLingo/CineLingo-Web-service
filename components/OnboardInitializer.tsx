"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export default function OnboardInitializer() {
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const run = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const isTruthy = (v: unknown) => v === true || v === "true" || v === "1";
        const onboarded = isTruthy(user.user_metadata?.onboarded);
        if (onboarded) return;

        const provider = (user.app_metadata as { provider?: string } | undefined)?.provider;

        if (provider === 'email') {
          await fetch("/api/auth/onboard", { method: "POST" });
          await supabase.auth.refreshSession();
          return;
        }

        if (provider === 'google') {
          const termsAgreed = isTruthy(user.user_metadata?.terms_agreed);
          const voiceAgreed = isTruthy(user.user_metadata?.voice_agreed);
          const copyrightAgreed = isTruthy(user.user_metadata?.copyright_agreed);
          if (termsAgreed && voiceAgreed && copyrightAgreed) {
            await fetch("/api/auth/onboard", { method: "POST" });
            await supabase.auth.refreshSession();
          }
          return;
        }

        // 기타 프로바이더는 보수적으로 이메일과 동일 처리
        await fetch("/api/auth/onboard", { method: "POST" });
        await supabase.auth.refreshSession();
      } catch {
        // noop
      }
    };

    void run();
  }, []);

  return null;
}


