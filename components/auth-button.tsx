"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "./logout-button";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { LoadingSpinner } from "./ui/loading";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // 다시 true로 복원
  const supabase = createClient();

  useEffect(() => {
    // 초기 사용자 상태 가져오기
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Failed to get user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // 로딩 중일 때는 예쁜 스피너 표시
  if (loading) {
    return (
      <div className="flex gap-2">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return user ? (
    <div className="flex items-center gap-2">
      <Button 
        asChild 
        size="sm"
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-white font-medium"
      >
        <Link href="/user/results">MyPage</Link>
      </Button>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button 
        asChild 
        size="sm"
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-white font-medium"
      >
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button 
        asChild 
        size="sm"
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-white font-medium"
      >
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
