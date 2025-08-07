import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

// Verified User 판별 함수
function isVerifiedUser(user: any): boolean {
  if (!user) {
    console.log('isVerifiedUser: No user provided');
    return false;
  }
  
  console.log('=== Middleware User Check ===');
  console.log('User ID:', user.id);
  console.log('User metadata:', JSON.stringify(user.user_metadata, null, 2));
  
  // 필수 약관 3개 모두 동의했는지 확인
  const termsAgreed = user.user_metadata?.terms_agreed === true || 
                     user.user_metadata?.terms_agreed === 'true' || 
                     user.user_metadata?.terms_agreed === '1';
  const voiceAgreed = user.user_metadata?.voice_agreed === true || 
                     user.user_metadata?.voice_agreed === 'true' || 
                     user.user_metadata?.voice_agreed === '1';
  const copyrightAgreed = user.user_metadata?.copyright_agreed === true || 
                         user.user_metadata?.copyright_agreed === 'true' || 
                         user.user_metadata?.copyright_agreed === '1';
  
  console.log('Terms agreed check:', {
    raw: user.user_metadata?.terms_agreed,
    type: typeof user.user_metadata?.terms_agreed,
    result: termsAgreed
  });
  console.log('Voice agreed check:', {
    raw: user.user_metadata?.voice_agreed,
    type: typeof user.user_metadata?.voice_agreed,
    result: voiceAgreed
  });
  console.log('Copyright agreed check:', {
    raw: user.user_metadata?.copyright_agreed,
    type: typeof user.user_metadata?.copyright_agreed,
    result: copyrightAgreed
  });
  
  const isVerified = termsAgreed && voiceAgreed && copyrightAgreed;
  console.log('Final result - Is verified user:', isVerified);
  console.log('================================');
  
  return isVerified;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('=== Middleware Request ===');
  console.log('Pathname:', request.nextUrl.pathname);
  console.log('User exists:', !!user);

  // API 경로는 미들웨어 검사를 건너뛰기
  if (request.nextUrl.pathname.startsWith("/api")) {
    console.log('API path - skipping middleware');
    return supabaseResponse;
  }

  // 로그인하지 않은 사용자 처리
  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/share")
  ) {
    console.log('No user - redirecting to login');
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // 로그인한 사용자이지만 약관 동의를 완료하지 않은 경우
  if (user && !isVerifiedUser(user)) {
    console.log('User not verified - checking if should redirect to terms');
    // 약관 동의 페이지로 리다이렉트 (약관 동의 페이지 자체는 제외)
    if (!request.nextUrl.pathname.startsWith("/auth/terms") &&
        !request.nextUrl.pathname.startsWith("/auth/login") &&
        !request.nextUrl.pathname.startsWith("/auth/sign-up") &&
        !request.nextUrl.pathname.startsWith("/auth/sign-up-success") &&
        !request.nextUrl.pathname.startsWith("/auth/error") &&
        !request.nextUrl.pathname.startsWith("/auth/auth-code-error") &&
        !request.nextUrl.pathname.startsWith("/auth/forgot-password") &&
        !request.nextUrl.pathname.startsWith("/auth/update-password") &&
        !request.nextUrl.pathname.startsWith("/auth/confirm") &&
        !request.nextUrl.pathname.startsWith("/auth/callback")) {
      
      console.log('Redirecting to terms page');
      const url = request.nextUrl.clone();
      url.pathname = "/auth/terms";
      return NextResponse.redirect(url);
    }
  }

  console.log('Middleware check passed - continuing');
  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
