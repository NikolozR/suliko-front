'use client'
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage('sidebar-collapsed', false);

  return (
    <div className="flex">
      <Sidebar onCollapse={setIsSidebarCollapsed} />
      <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <MainContent />
      </div>
    </div>
  );
}
