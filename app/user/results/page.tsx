import { createClient } from "@/lib/supabase/server";
import { assertUserTermsOrRedirect } from "@/lib/terms";
import UserResultsContent from "./user-results-content";

// 서버 컴포넌트로 SSR 가드 처리
export default async function UserResultsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null; // 미들웨어에서 처리됨
  }
  
  // 약관 동의 여부 확인 (미동의 시 /auth/terms로 리다이렉트)
  await assertUserTermsOrRedirect(user.id, '/user/results');
  
  // 클라이언트 컴포넌트 렌더링
  return <UserResultsContent />;
} 