import { useSidebarStore } from "@/store/sidebarStore";

/**
 * Custom hook that provides responsive margin classes for content areas
 * that need to work with the sidebar layout.
 * 
 * Returns the appropriate margin classes:
 * - Mobile collapsed (auto): ml-16 (sidebar w-16 still visible)
 * - Mobile expanded (manual): no margin on mobile, sidebar overlays with backdrop
 * - Desktop collapsed: ml-16 
 * - Desktop expanded: ml-56 lg:ml-64
 */
export const useSidebarLayout = () => {
  const { isCollapsed } = useSidebarStore();

  // Complex responsive logic:
  // - Always ml-16 for collapsed state (mobile and desktop)
  // - When expanded: ml-16 only on mobile (overlay), responsive margins on desktop
  const contentMarginClass = isCollapsed 
    ? "ml-16" 
    : "ml-16 md:ml-56 lg:ml-64";

  return {
    contentMarginClass,
    isCollapsed,
  };
}; 