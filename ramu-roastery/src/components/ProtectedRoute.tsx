"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import TourGuide from "./Onboarding/TourGuide";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"admin" | "customer" | "b2b">;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname || '/')}`);
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to home if authenticated but role is not allowed
        router.push("/");
      }
    }
  }, [user, isLoading, router, pathname, allowedRoles]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // If user exists and either no specific roles are required, or user's role is in the allowed list
  if (user && (!allowedRoles || allowedRoles.includes(user.role))) {
    return (
      <>
        {children}
      </>
    );
  }

  return null; // Will redirect in useEffect
}
