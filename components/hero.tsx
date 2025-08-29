import { Button } from "./ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] px-6 sm:px-8 py-12 sm:py-16 animate-fade-in">
      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-col items-center text-center space-y-8 sm:space-y-12 max-w-md sm:max-w-lg mx-auto">
        {/* 브랜드 타이틀 */}
        <div className="space-y-6 sm:space-y-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold animate-gradient leading-tight">
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Lingo Voice</span>
              <span className="absolute bottom-0 left-full ml-3 text-xs text-gray-500 dark:text-gray-400 translate-y-[1px]">Beta</span>
            </span>
          </h1>
        </div>

        {/* 메인 설명 */}
        <div className="space-y-6 sm:space-y-8">
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-900 dark:text-gray-100 leading-relaxed font-medium">
            내가 원하는 말을, 내가 듣고 싶은 목소리로.
          </p>
        </div>

        {/* 서브 설명 */}
        <div className="space-y-4 sm:space-y-6">
          <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 font-medium">
           3초 내외의 목소리 샘플이면 충분합니다.
          </p>
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed font-normal">

            자연스럽고 감정이 담긴 한국어 음성.
          </p>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex flex-col items-center space-y-6 sm:space-y-8 w-full max-w-sm sm:max-w-md mx-auto mt-12 sm:mt-16">
        {/* 메인 버튼 */}
        <Button 
          asChild 
          size="lg" 
          className="w-full text-lg sm:text-xl px-8 py-6 h-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl rounded-xl font-medium hover-lift text-white"
        >
          <Link href="/upload">시작하기</Link>
        </Button>

        {/* 서브 버튼 */}
        <Button 
          asChild 
          size="sm"
          variant="outline"
          className="w-full text-sm sm:text-base px-6 py-4 h-auto transition-all duration-300 transform hover:scale-105 border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-300 rounded-xl font-medium"
        >
          <Link href="/user/results">이전 결과 보기</Link>
        </Button>
      </div>

      {/* 서비스 이용 안내 - 스크롤 후 보이는 영역 */}
      <div className="w-full max-w-sm sm:max-w-lg mx-auto mt-16 sm:mt-20">
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed font-normal">
          합법적이고 건전한 사용을 위해 만들어졌습니다.
          <br />
          타인의 동의 없는 음성 복제, 사칭, 범죄 목적의 사용은 금지됩니다.
        </p>
      </div>
    </div>
  );
}
