'use client'
import "../globals.css";
import Sidebar from "@/shared/components/Sidebar";
import { useSidebarStore } from "@/shared/store/sidebarStore";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isCollapsed } = useSidebarStore();

  const mainClass = isCollapsed
    ? "!ml-16 md:!ml-16 lg:!ml-16 transition-all duration-300"
    : "!ml-16 md:!ml-56 lg:!ml-64 transition-all duration-300";

  return (
    <div className="relative">
      <Sidebar />
      <main className={`sidebar-content ${mainClass}`}>
        {children}
      </main>
    </div>
  );
}
