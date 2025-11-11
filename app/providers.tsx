"use client";

import { Provider } from "react-redux";
// import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/toaster";
import { store } from "@/store/store";
import { AuthInitializer } from "@/components/auth-initializer";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer />
      {children}
      <Toaster />
      {/* <Analytics /> */}
    </Provider>
  );
}
