import { Button } from "./ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <div className="flex flex-col gap-12 items-center text-center animate-fade-in">
      {/* 메인 타이틀 */}
      <div className="space-y-6">
        <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
          Nine seconds
        </h1>
        <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
          내가 원하는 말을, 내가 듣고 싶은 목소리로.
        </p>
      </div>

      {/* 주요 설명 */}
      <div className="space-y-8 max-w-3xl">
        <div className="space-y-4">
          <p className="text-lg lg:text-xl font-medium text-foreground">
            9초면 충분합니다.
          </p>
          <p className="text-base lg:text-lg text-muted-foreground leading-relaxed">
            짧은 목소리 샘플로, 당신의 목소리처럼, 또는 원하는 누군가처럼.
            <br />
            자연스럽고 감정이 담긴 한국어 음성.
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-lg lg:text-xl font-medium text-foreground">
            지금 바로, 시작해보세요.
          </p>
        </div>
      </div>

      {/* 시작하기 버튼 */}
      <div className="pt-8">
        <Button 
          asChild 
          size="lg" 
          className="text-lg px-8 py-6 h-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl hover-lift"
        >
          <Link href="/upload">시작하기</Link>
        </Button>
      </div>

      {/* 구분선 */}
      <div className="w-full max-w-2xl p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
