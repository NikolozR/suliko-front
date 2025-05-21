"use client";
import MainContent from "@/components/MainContent";
import { useSidebarStore } from "@/store/sidebarStore";

export default function Home() {
  const { isCollapsed } = useSidebarStore();

  return (
    <div
      className={`flex-1 transition-all duration-300 ${
        isCollapsed ? "ml-16" : "ml-64"
      }`}
    >
      <MainContent />
    </div>
  );
}
