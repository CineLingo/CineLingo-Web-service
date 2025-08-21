import FileUploadDemo from "./upload-form"
import { NavTheme } from "@/components/nav-theme"
import { createClient } from "@/lib/supabase/server";
import { assertUserTermsOrRedirect } from "@/lib/terms";

export default async function UploadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // 로그인하지 않은 사용자는 미들웨어에서 처리됨
    return null;
  }
  
  // 약관 동의 여부 확인 (미동의 시 /auth/terms로 리다이렉트)
  await assertUserTermsOrRedirect(user.id, '/upload');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <NavTheme theme="upload" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">음성 변환</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">음성을 선택하고 텍스트를 입력하세요</p>
        </div>
        <FileUploadDemo />
      </div>
    </div>
  );
}
