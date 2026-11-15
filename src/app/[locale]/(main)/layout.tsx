import Sidebar from "@/shared/components/Sidebar";
import Topbar from "@/shared/components/shell/Topbar";
import MobileBottomNav from "@/shared/components/MobileBottomNav";
import { cookies } from "next/headers";
import { getUserProfile } from "@/features/auth/services/userService";
import ResponsiveMainContent from "@/shared/components/ResponsiveMainContent";
import { officeNav } from "@/shared/nav/officeNav";
import { getLocale } from "next-intl/server";
import ShortcutsDialog from "@/shared/components/ShortcutsDialog";
import { ShortcutsProvider } from "@/shared/shortcuts/ShortcutsProvider";

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
  const office = userProfile ? await officeNav(await getLocale()) : null;

  return (
    <ShortcutsProvider>
      <div className="relative">
        <Topbar initiallySignedIn={Boolean(userProfile)} />
        <Sidebar initialUserProfile={userProfile} office={office} />
        <ResponsiveMainContent>
          {children}
        </ResponsiveMainContent>
        <MobileBottomNav />
      </div>
      <ShortcutsDialog />
    </ShortcutsProvider>
  );
} 