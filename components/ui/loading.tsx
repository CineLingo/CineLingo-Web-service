import { Loader2 } from "lucide-react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function Loading({ size = "md", text = "로딩 중...", className = "" }: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-8 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600 dark:text-blue-400`} />
      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{text}</p>
    </div>
  );
}

export function LoadingSpinner({ size = "md", className = "" }: Omit<LoadingProps, "text">) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600 dark:text-blue-400 ${className}`} />
  );
}
