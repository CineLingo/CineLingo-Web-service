import Link from "next/link";
import { hasEnvVars } from "@/lib/utils";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";

export function SiteNavbar() {
  return (
    <nav className="site-navbar w-full sticky top-0 z-50 bg-white/80 dark:bg-black/60 backdrop-blur border-b border-gray-200 dark:border-gray-800 h-14 sm:h-16">
      <div className="w-full max-w-4xl mx-auto flex justify-between items-center px-4 sm:px-6 h-full text-sm">
        <div className="flex items-center font-semibold">
          <Link
            href={"/"}
            className="text-lg sm:text-xl font-bold"
          >
            <span className="inline-flex items-baseline">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Lingo Voice</span>
              <span className="ml-2 text-[8px] text-gray-500 dark:text-gray-400 translate-y-[1px]">Beta</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 w-40 sm:w-56 justify-end">
          {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
        </div>
      </div>
    </nav>
  );
}


