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

        const onboarded = user.user_metadata?.onboarded === true ||
          user.user_metadata?.onboarded === "true" ||
          user.user_metadata?.onboarded === "1";
        if (onboarded) return;

        await fetch("/api/auth/onboard", { method: "POST" });
        // 세션 리프레시로 메타데이터 반영
        await supabase.auth.refreshSession();
      } catch {
        // noop
      }
    };

    void run();
  }, []);

  return null;
}


