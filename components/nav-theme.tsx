"use client";

import { useEffect } from "react";

type NavTheme = "default" | "upload";

export function NavTheme({ theme }: { theme: NavTheme }) {
  useEffect(() => {
    const htmlEl = document.documentElement;
    const prev = htmlEl.getAttribute("data-nav-theme");
    htmlEl.setAttribute("data-nav-theme", theme);
    return () => {
      if (prev) htmlEl.setAttribute("data-nav-theme", prev);
      else htmlEl.removeAttribute("data-nav-theme");
    };
  }, [theme]);
  return null;
}


