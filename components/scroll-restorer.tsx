"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollRestorer() {
  const pathname = usePathname();

  useEffect(() => {
    // 페이지 이동 시 항상 최상단으로 스크롤
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
