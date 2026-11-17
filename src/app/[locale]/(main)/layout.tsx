import Sidebar from "@/shared/components/Sidebar";
import Topbar from "@/shared/components/shell/Topbar";
import MobileBottomNav from "@/shared/components/MobileBottomNav";
import { cookies } from "next/headers";
import { getUserProfile } from "@/features/auth/services/userService";
import ResponsiveMainContent from "@/shared/components/ResponsiveMainContent";
import { OfficePresenceProvider } from "@/features/onboarding/components/FirstRunCard";
import { officeContext } from "@/shared/nav/officeNav";
import { ZoneGuard } from "@office/shared/components/zone-guard";
import { enabledLocalModules } from "@office/i18n/office-path";
import { getLocale } from "next-intl/server";
import ShortcutsDialog from "@/shared/components/ShortcutsDialog";
import { ShortcutsProvider } from "@/shared/shortcuts/ShortcutsProvider";

const SIDEBAR_WIDTH_SCRIPT = "(function(){try{var c=false;try{c=JSON.parse(localStorage.getItem('sidebar-storage')||'{}').state.isCollapsed===true}catch(e){}var v=innerWidth<768?['0','0','0']:c?['4rem','4rem','4rem']:['14rem','14rem','16rem'];var s=document.documentElement.style;s.setProperty('--sidebar-width',v[0]);s.setProperty('--sidebar-width-md',v[1]);s.setProperty('--sidebar-width-lg',v[2])}catch(e){}})()";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  let userProfile = null;
  if (token) {
    try {
      const { useAuthStore } = await import("@/features/auth/store/authStore");
      const originalState = useAuthStore.getState();
      
      useAuthStore.setState({ 
        ...originalState, 
        token, 
        refreshToken: cookieStore.get('refreshToken')?.value || null 
      });
      
      userProfile = await getUserProfile();
      
      useAuthStore.setState(originalState);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  }

  // The Office half of the one sidebar, when this person is signed in to Office.
  const office = userProfile ? await officeContext(await getLocale()) : null;
  // Office's modules this app serves (office-zone.ts). A navigation from here
  // to any other /app page is a page load: the Office deployment answers it.
  const localOffice = enabledLocalModules();

  return (
    <ShortcutsProvider>
      <OfficePresenceProvider hasOffice={Boolean(office)}>
      <div className="relative">
        <ZoneGuard owns={{ only: localOffice }} />
        {/* Which Office modules have clean addresses here (office/i18n/navigation.ts), before anything renders. */}
        <script dangerouslySetInnerHTML={{ __html: `window.__sulikoLocal=${JSON.stringify(localOffice)}` }} />
        {/* The sidebar's width, from the saved setting, before the page is drawn:
            otherwise the content is drawn under the sidebar and slides right on
            every page load (ResponsiveMainContent keeps it in sync afterwards). */}
        <script dangerouslySetInnerHTML={{ __html: SIDEBAR_WIDTH_SCRIPT }} />
        <Topbar initiallySignedIn={Boolean(userProfile)} office={office} />
        <Sidebar initialUserProfile={userProfile} office={office?.nav ?? null} />
        <ResponsiveMainContent>
          {children}
        </ResponsiveMainContent>
        <MobileBottomNav office={office} />
      </div>
      </OfficePresenceProvider>
      <ShortcutsDialog />
    </ShortcutsProvider>
  );
} 