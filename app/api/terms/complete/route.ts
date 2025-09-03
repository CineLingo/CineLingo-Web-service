import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    let body;
    let redirectTo: string | null = null;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {
        terms_agreed: formData.get('terms_agreed') === 'true',
        voice_agreed: formData.get('voice_agreed') === 'true',
        copyright_agreed: formData.get('copyright_agreed') === 'true',
        ai_agreed: formData.get('ai_agreed') === 'true'
      };
      redirectTo = formData.get('redirectTo') as string;
    } else {
      return NextResponse.json(
        { error: "지원하지 않는 Content-Type입니다." },
        { status: 400 }
      );
    }
    
    const { terms_agreed, voice_agreed, copyright_agreed, ai_agreed } = body;

    // 필수 필드 검증
    if (typeof terms_agreed !== 'boolean' || 
        typeof voice_agreed !== 'boolean' || 
        typeof copyright_agreed !== 'boolean' || 
        typeof ai_agreed !== 'boolean') {
      return NextResponse.json(
        { error: "모든 약관 동의 상태가 필요합니다." },
        { status: 400 }
      );
    }

    // 필수 약관 3개 모두 동의했는지 확인
    if (!terms_agreed || !voice_agreed || !copyright_agreed) {
      return NextResponse.json(
        { error: "필수 약관에 모두 동의해야 합니다." },
        { status: 400 }
      );
    }
    
    // 1) 사용자 메타데이터에 약관 동의 상태 반영 (문자열 아닌 boolean 저장)
    const { error: metaError1 } = await supabase.auth.updateUser({
      data: {
        terms_agreed: Boolean(terms_agreed),
        voice_agreed: Boolean(voice_agreed),
        copyright_agreed: Boolean(copyright_agreed),
        ai_agreed: Boolean(ai_agreed),
      }
    });
    if (metaError1) {
      console.warn('사용자 메타데이터 업데이트 실패:', metaError1.message);
    }

    // 2) 4개 public 테이블 upsert (온보딩 로직 인라인)
    // users
    const { error: usersError } = await supabase
      .from('users')
      .upsert({
        user_id: user.id,
        email: user.email,
        display_name: '',
        avatar_url: '',
        auth_provider: true,
        balance: 0,
      }, { onConflict: 'user_id' });
    if (usersError) {
      return NextResponse.json({ error: `users upsert failed: ${usersError.message}` }, { status: 500 });
    }

    // accounts
    const { error: accountsError } = await supabase
      .from('accounts')
      .upsert({
        email: user.email,
        name: '',
        usage: 0.0,
      }, { onConflict: 'email' });
    if (accountsError) {
      return NextResponse.json({ error: `accounts upsert failed: ${accountsError.message}` }, { status: 500 });
    }

    // account_id 조회
    const { data: accountData, error: accountQueryError } = await supabase
      .from('accounts')
      .select('account_id')
      .eq('email', user.email)
      .single();
    if (accountQueryError || !accountData) {
      return NextResponse.json({ error: `account_id fetch failed: ${accountQueryError?.message || 'not found'}` }, { status: 500 });
    }
    const accountId = accountData.account_id as string;

    // user_to_account_mapping
    const { error: mappingError } = await supabase
      .from('user_to_account_mapping')
      .upsert({
        user_id: user.id,
        account_id: accountId,
      }, { onConflict: 'user_id,account_id' });
    if (mappingError) {
      return NextResponse.json({ error: `mapping upsert failed: ${mappingError.message}` }, { status: 500 });
    }

    // terms_agreement
    const agreedAll = Boolean(terms_agreed && voice_agreed && copyright_agreed);
    const { error: termsError } = await supabase
      .from('terms_agreement')
      .upsert({
        account_id: accountId,
        terms_version: '1.0',
        agreed: agreedAll,
        critical_keys: {
          terms_agreed: Boolean(terms_agreed),
          voice_agreed: Boolean(voice_agreed),
          copyright_agreed: Boolean(copyright_agreed),
          ai_agreed: Boolean(ai_agreed),
        },
      }, { onConflict: 'account_id' });
    if (termsError) {
      return NextResponse.json({ error: `terms upsert failed: ${termsError.message}` }, { status: 500 });
    }

    // 3) onboarded=true로 메타데이터 표시
    const { error: metaError2 } = await supabase.auth.updateUser({
      data: {
        onboarded: true,
        terms_agreed: true,
        voice_agreed: true,
        copyright_agreed: true,
        ai_agreed: Boolean(ai_agreed),
      }
    });
    if (metaError2) {
      console.warn('사용자 메타데이터 onboarded 표시 실패:', metaError2.message);
    }

    // 세션 갱신 (백그라운드)
    supabase.auth.refreshSession().catch(error => {
      console.warn('서버 세션 갱신 실패:', error);
    });

    // 리다이렉트할 URL 결정 (내부 경로 화이트리스트)
    if (!redirectTo || typeof redirectTo !== 'string') {
      redirectTo = '/';
    }
    const isInternalPath = redirectTo.startsWith('/');
    const safePath = isInternalPath ? redirectTo : '/';
    const redirectUrl = new URL(safePath, request.url);
    return NextResponse.redirect(redirectUrl, 303);

  } catch (error) {
    console.error('약관 동의 API 오류:', error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다: " + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
