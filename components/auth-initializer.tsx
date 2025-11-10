"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setAuth } from "@/store/slices/authSlice";
import type { AppDispatch } from "@/store/store";

export function AuthInitializer() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Load auth from localStorage on page load/refresh
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      const userStr = localStorage.getItem("user");

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          dispatch(setAuth({ token, user }));
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
          // Clear invalid data
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
        }
      }
    }
  }, [dispatch]);

  return null;
}

