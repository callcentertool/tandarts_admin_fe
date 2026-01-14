"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import { logout } from "@/store/slices/authSlice";
import { Calendar, Users, HelpCircle, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Image from "next/image";
import SideBarImage from "../../public/sidebar.png";

interface SidebarProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export function Sidebar(props: SidebarProps = {}) {
  const { isOpen: externalIsOpen, setIsOpen: externalSetIsOpen } = props;
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "Admin";
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    dispatch(logout());
    router.push("/login");
  };

  // Active link styling function
  const getLinkClass = (href: string, isCenter: boolean) => {
    const isActive = pathname === href;
    return `w-full justify-start text-white hover:text-primary hover:bg-background ${
      isActive ? "bg-background text-primary" : ""
    } ${isCenter ? "my-1" : ""}`;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative w-full md:w-64 bg-primary text-white min-h-screen md:max-h-screen flex flex-col z-40 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Mobile Close Button */}
        <div className="md:hidden flex justify-end p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 p-2 h-8 w-8"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-2">
          <div className="relative w-full h-16 md:h-auto aspect-[16/9]">
            <Image
              src={SideBarImage}
              alt="side_image"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <nav className="flex-1 pl-1 pr-5 space-y-2">
          <Link href="/appointments" onClick={() => setIsOpen(false)}>
            <Button
              variant="ghost"
              className={getLinkClass("/appointments", false)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm">Appointments</span>
            </Button>
          </Link>

          {isAdmin && (
            <>
              <Link href="/users" onClick={() => setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className={getLinkClass("/users", true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  <span className="text-sm">Users</span>
                </Button>
              </Link>

              <Link href="/questionnaires" onClick={() => setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className={getLinkClass("/questionnaires", false)}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">Questionnaires</span>
                </Button>
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 space-y-2 mb-12">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-white hover:bg-primary"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="text-sm">Logout</span>
          </Button>
        </div>
      </div>
    </>
  );
}
