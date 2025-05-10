'use client'
import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Clock, HelpCircle, MessageSquare, User, ChevronLeft, ChevronRight } from 'lucide-react';
import SulikoLogoBlack from "../../public/Suliko_logo_black.svg";
import SulikoLogoWhite from "../../public/suliko_logo_white.svg";
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface SidebarProps {
  onCollapse: (collapsed: boolean) => void;
}

const Sidebar: FC<SidebarProps> = ({ onCollapse }) => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebar-collapsed', false);


  function handleCollapse() {
    onCollapse(!isCollapsed);
    setIsCollapsed(!isCollapsed);
  }

  const isActive = (path: string) => pathname === path;

  const getLinkClasses = (path: string) => {
    const baseClasses = "flex items-center space-x-3 p-2 rounded group";
    const activeClasses = "suliko-default-bg text-white hover:opacity-90 hover:scale-[1.02]";
    const inactiveClasses = "hover:bg-accent hover:text-accent-foreground hover:translate-x-1";
    
    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} h-screen p-4 fixed left-0 top-0 transition-all duration-300`}>
      <div className="flex justify-between items-center mb-8">
        {!isCollapsed && (
          <Image 
            src={theme === 'dark' ? SulikoLogoWhite : SulikoLogoBlack} 
            width={100} 
            alt="Suliko Logo" 
            className="transition-all duration-300"
          />
        )}
        <button
          onClick={handleCollapse}
          className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      
      <nav className="space-y-2">
        <Link 
          href="/"
          className={getLinkClasses('/')}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-start w-full' : 'space-x-3'}`}>
            <Plus className="text-xl group-hover:scale-110" />
            <span className={`${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'} overflow-hidden whitespace-nowrap`}>New Project</span>
          </div>
        </Link>

        <Link 
          href="/history"
          className={getLinkClasses('/history')}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-start w-full' : 'space-x-3'}`}>
            <Clock className="text-xl group-hover:scale-110" />
            <span className={`${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'} overflow-hidden whitespace-nowrap`}>History</span>
          </div>
        </Link>

        <Link 
          href="/help"
          className={getLinkClasses('/help')}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-start w-full' : 'space-x-3'}`}>
            <HelpCircle className="text-xl group-hover:scale-110" />
            <span className={`${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'} overflow-hidden whitespace-nowrap`}>Help</span>
          </div>
        </Link>

        <Link 
          href="/feedback"
          className={getLinkClasses('/feedback')}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-start w-full' : 'space-x-3'}`}>
            <MessageSquare className="text-xl group-hover:scale-110" />
            <span className={`${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'} overflow-hidden whitespace-nowrap`}>Feedback</span>
          </div>
        </Link>
      </nav>

      <div className="absolute bottom-4 w-full left-0 px-4">
        <Link 
          href="/profile"
          className={getLinkClasses('/profile')}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
            <User className="text-xl group-hover:scale-110" />
            <span className={`${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'} overflow-hidden whitespace-nowrap`}>Profile</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar; 