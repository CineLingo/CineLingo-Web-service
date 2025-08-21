import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * 사용자의 약관 동의 여부를 DB에서 확인하고, 미동의 시 약관 동의 페이지로 리다이렉트
 * @param userId 사용자 ID
 * @param currentPath 현재 페이지 경로 (선택사항)
 */
export async function assertUserTermsOrRedirect(userId: string, currentPath?: string) {
  const supabase = await createClient();
  
  // 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  // 사용자 타입 확인
  const isGoogleOAuth = user.app_metadata?.provider === 'google';
  
  // 먼저 user_to_account_mapping에서 account_id 찾기
  const { data: mappingData, error: mappingError } = await supabase
    .from('user_to_account_mapping')
    .select('account_id')
    .eq('user_id', userId)
    .single();

  if (mappingError || !mappingData) {
    // 사용자 타입에 따라 적절한 처리
    if (isGoogleOAuth) {
      const redirectUrl = currentPath 
        ? `/auth/terms/google?redirectTo=${encodeURIComponent(currentPath)}`
        : '/auth/terms/google';
      redirect(redirectUrl);
    } else {
      // 이메일 회원가입 사용자는 이미 로그인된 상태
      // 약관 동의가 필요하면 이메일 확인 페이지로 이동
      redirect('/auth/email-confirmed');
    }
  }

  // terms_agreement 테이블에서 약관 동의 여부 확인
  const { data: termsData, error } = await supabase
    .from('terms_agreement')
    .select('agreed, critical_keys')
    .eq('account_id', mappingData.account_id)
    .single();

  if (error || !termsData) {
    // 사용자 타입에 따라 적절한 처리
    if (isGoogleOAuth) {
      const redirectUrl = currentPath 
        ? `/auth/terms/google?redirectTo=${encodeURIComponent(currentPath)}`
        : '/auth/terms/google';
      redirect(redirectUrl);
    } else {
      // 이메일 회원가입 사용자는 이미 로그인된 상태
      redirect('/auth/email-confirmed');
    }
  }

  // critical_keys에서 세부 약관 동의 여부 확인
  const { agreed, critical_keys } = termsData;
  
  if (!agreed || !critical_keys) {
    // 사용자 타입에 따라 적절한 처리
    if (isGoogleOAuth) {
      const redirectUrl = currentPath 
        ? `/auth/terms/google?redirectTo=${encodeURIComponent(currentPath)}`
        : '/auth/terms/google';
      redirect(redirectUrl);
    } else {
      // 이메일 회원가입 사용자는 이미 로그인된 상태
      redirect('/auth/email-confirmed');
    }
  }

  // critical_keys에서 필수 약관 3개 확인
  const { terms_agreed, voice_agreed, copyright_agreed } = critical_keys;
  
  if (!terms_agreed || !voice_agreed || !copyright_agreed) {
    // 사용자 타입에 따라 적절한 처리
    if (isGoogleOAuth) {
      const redirectUrl = currentPath 
        ? `/auth/terms/google?redirectTo=${encodeURIComponent(currentPath)}`
        : '/auth/terms/google';
      redirect(redirectUrl);
    } else {
      // 이메일 회원가입 사용자는 이미 로그인된 상태
      redirect('/auth/email-confirmed');
    }
  }
}

/**
 * 사용자의 약관 동의 여부를 DB에서 확인 (리다이렉트 없이 boolean 반환)
 * @param userId 사용자 ID
 * @returns 약관 동의 완료 여부
 */
export async function checkUserTerms(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  // 먼저 user_to_account_mapping에서 account_id 찾기
  const { data: mappingData, error: mappingError } = await supabase
    .from('user_to_account_mapping')
    .select('account_id')
    .eq('user_id', userId)
    .single();

  if (mappingError || !mappingData) {
    return false;
  }

  // terms_agreement 테이블에서 약관 동의 여부 확인
  const { data: termsData, error } = await supabase
    .from('terms_agreement')
    .select('agreed, critical_keys')
    .eq('account_id', mappingData.account_id)
    .single();

  if (error || !termsData) {
    return false;
  }

  const { agreed, critical_keys } = termsData;
  
  if (!agreed || !critical_keys) {
    return false;
  }

  // critical_keys에서 필수 약관 3개 확인
  const { terms_agreed, voice_agreed, copyright_agreed } = critical_keys;
  return !!(terms_agreed && voice_agreed && copyright_agreed);
}

// 클라이언트에서 사용할 수 있는 함수들
export const clientTermsUtils = {
  /**
   * 클라이언트에서 약관 동의 여부를 확인하는 함수
   * @param termsData 약관 동의 데이터
   * @returns 약관 동의 완료 여부
   */
  checkTermsFromData: (termsData: {
    agreed: boolean;
    critical_keys: {
      terms_agreed: boolean;
      voice_agreed: boolean;
      copyright_agreed: boolean;
      ai_agreed?: boolean;
    };
  } | null): boolean => {
    if (!termsData) return false;
    
    const { agreed, critical_keys } = termsData;
    if (!agreed || !critical_keys) return false;
    
    const { terms_agreed, voice_agreed, copyright_agreed } = critical_keys;
    return !!(terms_agreed && voice_agreed && copyright_agreed);
  }
};
