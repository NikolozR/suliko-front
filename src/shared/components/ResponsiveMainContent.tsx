"use client";
import { useSidebarStore } from "@/shared/store/sidebarStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useEffect, useState } from "react";
import WelcomeModal from "./WelcomeModal";

interface ResponsiveMainContentProps {
  children: React.ReactNode;
}

export default function ResponsiveMainContent({ children }: ResponsiveMainContentProps) {
  const { isCollapsed } = useSidebarStore();
  const { showWelcomeModal, setShowWelcomeModal } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // Set CSS custom properties based on sidebar state
    const root = document.documentElement;
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      root.style.setProperty('--sidebar-width', '0');
      root.style.setProperty('--sidebar-width-md', '0');
      root.style.setProperty('--sidebar-width-lg', '0');
    } else if (isCollapsed) {
      root.style.setProperty('--sidebar-width', '4rem');
      root.style.setProperty('--sidebar-width-md', '4rem');
      root.style.setProperty('--sidebar-width-lg', '4rem');
    } else {
      root.style.setProperty('--sidebar-width', '12rem'); // w-48
      root.style.setProperty('--sidebar-width-md', '14rem'); // md:w-56
      root.style.setProperty('--sidebar-width-lg', '16rem'); // lg:w-64
    }
  }, [isCollapsed, isMounted]);

  if (!isMounted) {
    // Server-side render with collapsed state to prevent layout shift
    return (
      <main className="sidebar-content pt-10" style={{ marginLeft: '4rem', transition: 'margin-left 300ms ease' }}>
        {children}
      </main>
    );
  }

  return (
    <>
      <main className="sidebar-content pt-10 pb-20 md:pb-0">
        {children}
      </main>
      <WelcomeModal 
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
    </>
  );
} 