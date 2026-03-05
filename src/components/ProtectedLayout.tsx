"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router, mounted]);

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end gap-3 px-4 lg:px-8 sticky top-0 z-30">
          <SearchBar />
          <NotificationBell />
        </header>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
