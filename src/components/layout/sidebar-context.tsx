"use client";
import { createContext, useContext, useEffect, useState } from "react";

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({ collapsed: false, toggle: () => {} });

const STORAGE_KEY = "ccpadms:sidebar-collapsed";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Baca preferensi tersimpan SETELAH mount (localStorage tidak ada di
  // server) -- hindari hydration mismatch, sama pola-nya dgn ThemeToggle.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "1") setCollapsed(true);
    setMounted(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  // Sebelum mount, render "expanded" dulu (default aman) supaya SSR &
  // client-first-render cocok -- efek di atas langsung menyesuaikan kalau
  // preferensi tersimpan ternyata "collapsed".
  return (
    <SidebarContext.Provider value={{ collapsed: mounted ? collapsed : false, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
