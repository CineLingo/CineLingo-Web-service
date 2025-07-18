import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 w-full flex flex-col">
        {/* 네비게이션 */}
        <nav className="w-full flex justify-center border-b border-b-gray-200 dark:border-b-gray-800 h-16 sm:h-20">
          <div className="w-full max-w-5xl flex justify-between items-center px-6 sm:px-8 py-4 sm:py-6 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"} className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Nine seconds
              </Link>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              {!hasEnvVars ? null : <AuthButton />}
            </div>
          </div>
        </nav>

        {/* 메인 콘텐츠 - 전체 화면 활용 */}
        <div className="flex-1 w-full">
          <Hero />
        </div>

        {/* 푸터 */}
        <footer className="w-full flex flex-col sm:flex-row items-center justify-center border-t border-t-gray-200 dark:border-t-gray-800 mx-auto text-center text-xs gap-4 sm:gap-6 py-8 sm:py-12 px-6 sm:px-8">
          <p className="text-gray-500 dark:text-gray-500">
            © 2025 CineLingo. 모든 권리 보유.
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
