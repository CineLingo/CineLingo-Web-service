"use client";

import { useEffect } from "react";

export function ScrollRestorer() {
  useEffect(() => {
    // 페이지 로드 시 저장된 스크롤 위치가 있으면 복원
    const savedScrollPosition = sessionStorage.getItem('scrollPosition');
    if (savedScrollPosition) {
      const scrollY = parseInt(savedScrollPosition, 10);
      window.scrollTo(0, scrollY);
      sessionStorage.removeItem('scrollPosition');
    }
  }, []);

  return null;
}
