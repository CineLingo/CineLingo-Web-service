import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
 

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 w-full flex flex-col">
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
