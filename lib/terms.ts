import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * user_metadata에서 약관 동의 상태를 빠르게 확인하는 함수 (캐시 우선)
 * @param user 사용자 객체
 * @returns 약관 동의 완료 여부
 */
export function checkUserTermsFromMetadata(user: { 
  user_metadata?: { 
    terms_agreed?: boolean | string; 
    voice_agreed?: boolean | string; 
    copyright_agreed?: boolean | string; 
  }; 
}): boolean {
  // user_metadata에서 약관 동의 상태 확인 (빠른 캐시)
  const termsAgreed = user.user_metadata?.terms_agreed === true || 
                     user.user_metadata?.terms_agreed === 'true' || 
                     user.user_metadata?.terms_agreed === '1';
  const voiceAgreed = user.user_metadata?.voice_agreed === true || 
                     user.user_metadata?.voice_agreed === 'true' || 
                     user.user_metadata?.voice_agreed === '1';
  const copyrightAgreed = user.user_metadata?.copyright_agreed === true || 
                         user.user_metadata?.copyright_agreed === 'true' || 
                         user.user_metadata?.copyright_agreed === '1';
  
  return !!(termsAgreed && voiceAgreed && copyrightAgreed);
}

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
  
  // 1단계: user_metadata에서 빠른 확인 (캐시 우선)
  const hasTermsInMetadata = checkUserTermsFromMetadata(user);
  
  if (hasTermsInMetadata) {
    // user_metadata에 약관 동의 정보가 있으면 DB 확인 생략
    return; // 성공적으로 통과
  }
  
  // 2단계: DB에서 확인 (최적화된 단일 쿼리 사용)
  const { hasTerms, isGoogleOAuth } = await checkUserTermsFromDB(userId);
  
  if (!hasTerms) {
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

/**
 * JOIN을 사용한 단일 쿼리로 약관 동의 확인 (DB 최적화)
 * @param userId 사용자 ID
 * @returns 약관 동의 상태와 사용자 타입
 */
export async function checkUserTermsFromDB(userId: string): Promise<{
  hasTerms: boolean;
  isGoogleOAuth: boolean;
}> {
  const supabase = await createClient();
  
  // 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { hasTerms: false, isGoogleOAuth: false };
  }
  
  const isGoogleOAuth = user.app_metadata?.provider === 'google';
  
  // JOIN을 사용하되 다중 매핑에도 안전하게 처리
  const { data, error } = await supabase
    .from('user_to_account_mapping')
    .select(`
      account_id,
      terms_agreement!inner(
        agreed,
        critical_keys
      )
    `)
    .eq('user_id', userId)
    .limit(1);
  
  if (error || !data || data.length === 0) {
    return { hasTerms: false, isGoogleOAuth };
  }
  
  type TermsAgreementRow = {
    terms_agreement:
      | { agreed: boolean; critical_keys: { terms_agreed?: boolean; voice_agreed?: boolean; copyright_agreed?: boolean } }[]
      | { agreed: boolean; critical_keys: { terms_agreed?: boolean; voice_agreed?: boolean; copyright_agreed?: boolean } };
  };
  const row = (Array.isArray(data) ? data[0] : data) as TermsAgreementRow;
  const { terms_agreement } = row;
  // terms_agreement는 배열이므로 첫 번째 요소 사용
  const termsData = Array.isArray(terms_agreement) ? terms_agreement[0] : terms_agreement;
  const { agreed, critical_keys } = termsData;
  
  if (!agreed || !critical_keys) {
    return { hasTerms: false, isGoogleOAuth };
  }
  
  const { terms_agreed, voice_agreed, copyright_agreed } = critical_keys;
  const hasTerms = !!(terms_agreed && voice_agreed && copyright_agreed);
  
  return { hasTerms, isGoogleOAuth };
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
