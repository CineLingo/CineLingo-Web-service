"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface HomeButtonProps {
  className?: string;
  variant?: "default" | "floating" | "minimal";
}

export default function HomeButton({ 
  className, 
  variant = "default" 
}: HomeButtonProps) {
  const baseClasses = "inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    default: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg focus:ring-blue-500 transition-all duration-300",
    floating: "fixed top-4 right-4 bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-full shadow-lg hover:shadow-xl border border-blue-200 dark:border-blue-700 focus:ring-blue-500 z-50 transition-all duration-300",
    minimal: "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-md hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 focus:ring-blue-500 transition-all duration-300"
  };

  return (
    <Link 
      href="/" 
      className={cn(
        baseClasses,
        variants[variant],
        className
      )}
      aria-label="홈으로 돌아가기"
    >
      <Home className="w-5 h-5" />
      {variant !== "minimal" && variant !== "floating" && (
        <span className="ml-2 font-medium">홈</span>
      )}
    </Link>
  );
} 