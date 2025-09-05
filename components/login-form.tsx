"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { GoogleAuthButton } from "@/components/google-auth-button";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      // 로그인 성공 후 페이지 새로고침하여 상단바 상태 즉시 반영
      const targetPath = "/";
      window.location.href = targetPath;
    } catch (error: unknown) {
      const rawMessage = error instanceof Error ? error.message : "";
      const translated = rawMessage.toLowerCase().includes("invalid login credentials")
        ? "이메일 또는 비밀번호가 올바르지 않습니다."
        : (rawMessage || "오류가 발생했습니다");
      setError(translated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>
            계정에 로그인하려면 이메일을 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">비밀번호</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300" disabled={loading}>
                {loading ? "로그인 중..." : "로그인"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              계정이 없으신가요?{" "}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4"
              >
                회원가입
              </Link>
            </div>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                또는 다음으로 계속
              </span>
            </div>
          </div>
          <GoogleAuthButton />
        </CardContent>
      </Card>
    </div>
  );
}
