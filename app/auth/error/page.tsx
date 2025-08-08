"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import HomeButton from "@/components/home-button";
import Link from "next/link";

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "알 수 없는 오류가 발생했습니다.";

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <HomeButton variant="floating" />
      <div className="w-full max-w-md">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl text-red-600 dark:text-red-400">
              오류가 발생했습니다
            </CardTitle>
            <CardDescription className="text-base">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/auth/login">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
                <ArrowLeft className="mr-2 h-4 w-4" />
                로그인 페이지로 돌아가기
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                메인 페이지로 이동
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
