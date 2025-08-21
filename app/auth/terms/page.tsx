import { redirect } from "next/navigation";

export default function TermsPage() {
  // 기본 약관 페이지 접근 시 이메일 회원가입으로 리다이렉트
  redirect('/auth/terms/email-signup');
} 