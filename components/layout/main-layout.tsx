"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { Sidebar } from "./sidebar";
import { UserProfileDropdown } from "./user-profile-dropdown";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const user = useSelector((state: RootState) => state.auth.user);
  const [userName, setUserName] = useState<string>("User");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  useEffect(() => {
    // Get user name from localStorage or Redux store
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          if (userData?.name) {
            setUserName(userData.name);
          }
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
        }
      }
    }
    // Fallback to Redux store
    if (user?.name) {
      setUserName(user.name);
    }
  }, [user]);

  if (!token) {
    return null;
  }

  return (
    <div className="flex  bg-secondary">
      <div className="fixed top-0 left-0 h-screen z-20">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      </div>
      <div className="flex-1 ml-0 md:ml-64 overflow-auto min-h-screen">
        {/* Mobile: Header bar with Hamburger, Name, and Dropdown in one line */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-secondary border-b border-[#8E8E8E52] z-30">
          <div className="flex items-center gap-2 px-4 py-3">
            {/* Hamburger Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-foreground bg-transparent hover:bg-accent p-2 h-8 w-8 flex-shrink-0"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>

            {/* User Name */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold truncate">
                Hello {userName}!
              </h1>
            </div>

            {/* User Profile Dropdown */}
            <div className="flex-shrink-0">
              <UserProfileDropdown />
            </div>
          </div>
        </div>

        {/* Mobile: Content padding for fixed header */}
        <div className="md:hidden pt-14" />

        {/* Desktop: Header */}
        <div className="hidden md:block m-4 sm:m-6 border-b pb-8 border-[#8E8E8E52]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Hello {userName}!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Welcome back
              </p>
            </div>
            <UserProfileDropdown />
          </div>
        </div>

        <div className="max-sm:pt-5">{children}</div>
      </div>
    </div>
  );
}
