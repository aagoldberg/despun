"use client";

import { AuthProvider, useAuth } from "@/components/admin/AuthProvider";
import AdminNav from "@/components/admin/AdminNav";
import { usePathname } from "next/navigation";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Login page doesn't need the nav
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Not authenticated - redirect happens in AuthProvider
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Authenticated - show full layout
  return (
    <div className="min-h-screen bg-zinc-100 flex">
      <AdminNav />
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}
