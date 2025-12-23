"use client";

import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { WishlistProvider } from "@/hooks/useWishlist";
import { AuthProvider } from "@/hooks/useAuth";

export default function ClientProviders({
  children,
  clientId,
  initialUser,
}: {
  children: React.ReactNode;
  clientId: string;
  initialUser?: any;
}) {
    if (!clientId) {
    console.error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID — set in .env.local");
    return <>{children}</>; // hoặc render null / fallback
  }
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider initialUser={initialUser}>
        <WishlistProvider>{children}</WishlistProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}