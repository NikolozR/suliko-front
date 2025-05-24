import { useSidebarLayout } from "@/hooks/useSidebarLayout";
import { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component for pages that need to work with the sidebar layout.
 * Automatically handles responsive margins for desktop/mobile modes.
 */
export const PageWrapper: React.FC<PageWrapperProps> = ({ 
  children, 
  className = "" 
}) => {
  const { contentMarginClass } = useSidebarLayout();

  return (
    <div className={`transition-all duration-300 ${contentMarginClass} ${className}`}>
      {children}
    </div>
  );
}; 