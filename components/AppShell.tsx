"use client";

import React from "react";
import { usePathname } from "next/navigation";
import GlobalChrome from "@/components/GlobalChrome";
import GlobalFooter from "@/components/GlobalFooter";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname?.startsWith("/dang-nhap") || pathname?.startsWith("/dang-ky");

  console.log('AppShell pathname:', pathname);
  console.log('AppShell isAuth:', isAuth);

  if (isAuth) {
    // Không render header/footer global ở các trang auth
    console.log('AppShell: Auth page, no header/footer');
    return <>{children}</>;
  }

  console.log('AppShell: Rendering with GlobalChrome and GlobalFooter');
  return (
    <>
      <GlobalChrome />
      {children}
      <GlobalFooter />
    </>
  );
}
