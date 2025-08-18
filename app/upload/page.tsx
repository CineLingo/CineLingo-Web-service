import FileUploadDemo from "./upload-form"
import { NavTheme } from "@/components/nav-theme"

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <NavTheme theme="upload" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">음성 변환</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">음성을 선택하고 텍스트를 입력하세요</p>
        </div>
        <FileUploadDemo />
      </div>
    </div>
  );
}
