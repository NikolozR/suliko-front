'use client'
import { FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Clock, HelpCircle, MessageSquare, User } from 'lucide-react';
import SulikoLogoBlack from "../../public/Suliko_logo_black.svg";
import SulikoLogoWhite from "../../public/suliko_logo_white.svg";
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

const Sidebar: FC = () => {
  const pathname = usePathname();
  const { theme } = useTheme();

  const isActive = (path: string) => pathname === path;

  const getLinkClasses = (path: string) => {
    const baseClasses = "flex items-center space-x-3 p-2 rounded transition-all duration-200 group";
    const activeClasses = "suliko-default-bg text-white hover:opacity-90 hover:scale-[1.02]";
    const inactiveClasses = "hover:bg-accent hover:text-accent-foreground hover:translate-x-1";
    
    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <div className="w-64 h-screen bg-sidebar text-sidebar-foreground p-4 fixed left-0 top-0 border-r border-sidebar-border">
      <div className="mb-8">
        <Image 
          src={theme === 'dark' ? SulikoLogoWhite : SulikoLogoBlack} 
          width={100} 
          alt="Suliko Logo" 
          className="transition-opacity duration-300"
        />
      </div>
      
      <nav className="space-y-2">
        <Link 
          href="/"
          className={getLinkClasses('/')}
        >
          <Plus className="text-xl transition-transform group-hover:scale-110" />
          <span>New Project</span>
        </Link>

        <Link 
          href="/history"
          className={getLinkClasses('/history')}
        >
          <Clock className="text-xl transition-transform group-hover:scale-110" />
          <span>History</span>
        </Link>

        <Link 
          href="/help"
          className={getLinkClasses('/help')}
        >
          <HelpCircle className="text-xl transition-transform group-hover:scale-110" />
          <span>Help</span>
        </Link>

        <Link 
          href="/feedback"
          className={getLinkClasses('/feedback')}
        >
          <MessageSquare className="text-xl transition-transform group-hover:scale-110" />
          <span>Feedback</span>
        </Link>
      </nav>

      <div className="absolute bottom-4 w-full left-0 px-4">
        <Link 
          href="/profile"
          className={getLinkClasses('/profile')}
        >
          <User className="text-xl transition-transform group-hover:scale-110" />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar; 