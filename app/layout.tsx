import React from "react";
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import AppShell from "@/components/AppShell";
import { WishlistProvider } from "@/hooks/useWishlist";
import { AuthProvider } from "@/hooks/useAuth";
import { getUserFromServer } from "@/lib/get-user-server";
import "./swiper.css";
// import { GoogleOAuthProvider } from '@react-oauth/google';
import ClientProviders from "@/components/ClientProviders";

export const metadata = { title: "Siêu Thị Vina | Cửa hàng thương mại điện tử Siêu Thị Vina |" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  //lấy thông tin user trên server trước khi render layout
  const user = await getUserFromServer();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1074516250046-uo2cstomc492hf5nhj0u3n6aptrisnof.apps.googleusercontent.com";
  return (
    <html lang="vi" className="color-two font-exo header-sticky-style">
      <head>
        <link rel="shortcut icon" href="/assets/images/logo/favicon.png" />
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/select2.min.css" />
        <link rel="stylesheet" href="/assets/css/slick.css" />
        <link rel="stylesheet" href="/assets/css/jquery-ui.css" />
        <link rel="stylesheet" href="/assets/css/animate.css" />
        <link rel="stylesheet" href="/assets/css/aos.css" />
        <link rel="stylesheet" href="/assets/css/main.css" />
      </head>

      <body>
        {/* 2. Truyền user vào AuthProvider qua prop initialUser */}
        <ClientProviders clientId={clientId} initialUser={user}>
        <AuthProvider initialUser={user}>
          <WishlistProvider>
            <AppShell>
              {children}
            </AppShell>
          </WishlistProvider>
        </AuthProvider>
        </ClientProviders>

        <Analytics />

        {/* Các script giữ nguyên */}
        <Script src="/assets/js/jquery-3.7.1.min.js" strategy="beforeInteractive" />
        <Script src="/assets/js/slick.min.js" strategy="beforeInteractive" />
        <Script src="/assets/js/boostrap.bundle.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/select2.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/aos.js" strategy="afterInteractive" />
        <Script src="/assets/js/phosphor-icon.js" strategy="afterInteractive" />
        <Script src="/assets/js/jquery-ui.js" strategy="afterInteractive" />
        <Script src="/assets/js/marquee.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/vanilla-tilt.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/counter.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/wow.min.js" strategy="afterInteractive" />
        <Script id="theme-flags" strategy="afterInteractive">
          {`window.__THEME__ = { enableGlobalSearch: false };`}
        </Script>
        <Script src="/assets/js/main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
