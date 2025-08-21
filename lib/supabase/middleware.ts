import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

// 허용된 라우트 목록 (인증이 필요하지 않은 페이지들)
// 
// 🚨 새로운 페이지 추가 시 주의사항:
// 1. 공개 페이지 (로그인 없이 접근 가능): ALLOWED_ROUTES에 추가
// 2. 보호된 페이지 (로그인 + 약관 동의 필요): 추가하지 않음
// 3. 추가 후 개발 환경에서 경고 메시지 확인
//
// 예시:
// - 새로운 공개 페이지 '/about' 추가 시: ALLOWED_ROUTES에 '/about' 추가
// - 새로운 보호된 페이지 '/dashboard' 추가 시: 추가하지 않음 (자동으로 보호됨)
//
const ALLOWED_ROUTES = [
  '/',                    // 홈페이지 (루트)
  '/auth',                // 인증 관련 페이지들 (로그인, 회원가입, 약관 등)
  '/api',                 // API 엔드포인트들
  '/share',               // 공유 페이지들 (TTS 결과 공유)
  '/demo',                // 데모 페이지들 (오디오 플레이어 데모)
  '/tts-result'           // TTS 결과 페이지들 (공개 결과 보기)
];

// 라우트가 허용되는지 확인하는 함수
const isAllowedRoute = (pathname: string): boolean => {
  const allowed = ALLOWED_ROUTES.some(route => {
    // 정확한 경로 매칭을 위해 더 정교한 로직 사용
    if (route === '/') {
      // 루트 경로는 정확히 '/'인 경우만 허용
      return pathname === '/';
    } else {
      // 다른 경로들은 해당 경로로 시작하는지 확인
      return pathname.startsWith(route);
    }
  });
  
  // 개발 환경에서 새로운 라우트 경고 (비활성화)
  // if (process.env.NODE_ENV === 'development' && !allowed && !pathname.startsWith('/_next')) {
  //   console.warn(`🚨 새로운 라우트: ${pathname} - 미들웨어 허용 목록에 추가 필요`);
  //   console.warn(`💡 공개 페이지라면 ALLOWED_ROUTES에 추가하세요.`);
  //   console.warn(`💡 보호된 페이지라면 추가하지 마세요. (자동으로 보호됨)`);
  // }
  
  return allowed;
};

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

  // API 경로는 미들웨어 검사를 건너뛰기
  if (request.nextUrl.pathname.startsWith("/api")) {
    return supabaseResponse;
  }

  // 로그인하지 않은 사용자 처리
  if (
    !isAllowedRoute(request.nextUrl.pathname) &&
    !user
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    // 원래 가려던 페이지 정보를 쿼리 파라미터로 전달
    url.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // 로그인한 사용자는 모든 라우트 접근 허용
  // 약관 체크는 각 보호된 페이지에서 SSR로 처리

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
