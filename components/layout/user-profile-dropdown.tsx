"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import { logout } from "@/store/slices/authSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { KeyRound, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserProfileDropdown() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [userData, setUserData] = useState<{ name?: string; email?: string }>({
    name: "",
    email: "",
  });

  useEffect(() => {
    // Get user data from localStorage
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const parsedUser = JSON.parse(userStr);
          setUserData({
            name: parsedUser?.name || user?.name || "",
            email: parsedUser?.email || user?.email || "",
          });
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
          // Fallback to Redux store
          setUserData({
            name: user?.name || "",
            email: user?.email || "",
          });
        }
      } else {
        // Fallback to Redux store
        setUserData({
          name: user?.name || "",
          email: user?.email || "",
        });
      }
    }
  }, [user]);

  const handleResetPassword = () => {
    router.push("/reset-password");
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    dispatch(logout());
    router.push("/login");
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-1.5 md:py-2 h-auto bg-background hover:bg-accent border-none shadow-lg"
        >
          <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-primary/20 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs md:text-sm">
              {/* {getInitials(userData.name || "User")} */}
              <User className="w-10 h-10" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start text-left min-w-0">
            <span className="text-xs md:text-sm font-semibold text-foreground truncate max-w-[80px] md:max-w-none">
              {userData.name || "User"}
            </span>
            <span className="hidden md:block text-xs text-muted-foreground">
              {userData.email || ""}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-semibold">{userData.name || "User"}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {userData.email || ""}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleResetPassword} className="cursor-pointer">
          <KeyRound className="mr-2 h-4 w-4" />
          Reset Password
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

