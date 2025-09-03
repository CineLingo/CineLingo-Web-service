import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.email;
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 400 });
    }

    // 이미 온보딩된 사용자면 바로 OK
    const alreadyOnboarded = user.user_metadata?.onboarded === true ||
      user.user_metadata?.onboarded === "true" ||
      user.user_metadata?.onboarded === "1";

    // 약관 동의 상태 추출 (truthy 문자열도 허용)
    const termsAgreed = user.user_metadata?.terms_agreed === true ||
      user.user_metadata?.terms_agreed === "true" ||
      user.user_metadata?.terms_agreed === "1";
    const voiceAgreed = user.user_metadata?.voice_agreed === true ||
      user.user_metadata?.voice_agreed === "true" ||
      user.user_metadata?.voice_agreed === "1";
    const copyrightAgreed = user.user_metadata?.copyright_agreed === true ||
      user.user_metadata?.copyright_agreed === "true" ||
      user.user_metadata?.copyright_agreed === "1";
    const aiAgreed = user.user_metadata?.ai_agreed === true ||
      user.user_metadata?.ai_agreed === "true" ||
      user.user_metadata?.ai_agreed === "1";

    if (!alreadyOnboarded) {
      // 1) users upsert
      const { error: usersError } = await supabase
        .from("users")
        .upsert(
          {
            user_id: user.id,
            email,
            display_name: "",
            avatar_url: "",
            auth_provider: true,
            balance: 0,
          },
          { onConflict: "user_id" },
        );
      if (usersError) {
        return NextResponse.json({ error: `users upsert failed: ${usersError.message}` }, { status: 500 });
      }

      // 2) accounts upsert
      const { error: accountsError } = await supabase
        .from("accounts")
        .upsert(
          {
            email,
            name: "",
            usage: 0.0,
          },
          { onConflict: "email" },
        );
      if (accountsError) {
        return NextResponse.json({ error: `accounts upsert failed: ${accountsError.message}` }, { status: 500 });
      }

      // 3) account_id 조회
      const { data: accountData, error: accountQueryError } = await supabase
        .from("accounts")
        .select("account_id")
        .eq("email", email)
        .single();
      if (accountQueryError || !accountData) {
        return NextResponse.json({ error: `account_id fetch failed: ${accountQueryError?.message || "not found"}` }, { status: 500 });
      }
      const accountId = accountData.account_id as string;

      // 4) user_to_account_mapping upsert
      const { error: mappingError } = await supabase
        .from("user_to_account_mapping")
        .upsert(
          {
            user_id: user.id,
            account_id: accountId,
          },
          { onConflict: "user_id,account_id" },
        );
      if (mappingError) {
        return NextResponse.json({ error: `mapping upsert failed: ${mappingError.message}` }, { status: 500 });
      }

      // 5) terms_agreement upsert
      const { error: termsError } = await supabase
        .from("terms_agreement")
        .upsert(
          {
            account_id: accountId,
            terms_version: "1.0",
            agreed: Boolean(termsAgreed && voiceAgreed && copyrightAgreed),
            critical_keys: {
              terms_agreed: Boolean(termsAgreed),
              voice_agreed: Boolean(voiceAgreed),
              copyright_agreed: Boolean(copyrightAgreed),
              ai_agreed: Boolean(aiAgreed),
            },
          },
          { onConflict: "account_id" },
        );
      if (termsError) {
        return NextResponse.json({ error: `terms upsert failed: ${termsError.message}` }, { status: 500 });
      }

      // 6) 사용자 메타데이터 업데이트 (onboarded 플래그)
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          onboarded: true,
          // 약관 키를 명시적으로 true로 보정 (이미 불린 처리됨)
          terms_agreed: Boolean(termsAgreed),
          voice_agreed: Boolean(voiceAgreed),
          copyright_agreed: Boolean(copyrightAgreed),
          ai_agreed: Boolean(aiAgreed),
        },
      });
      if (updateError) {
        return NextResponse.json({ error: `metadata update failed: ${updateError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, onboarded: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


