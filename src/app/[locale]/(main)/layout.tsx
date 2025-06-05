import Sidebar from "@/shared/components/Sidebar";
import { cookies } from "next/headers";
import { getUserProfile } from "@/features/auth/services/userService";
import ResponsiveMainContent from "@/shared/components/ResponsiveMainContent";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  console.log(token, "FROM COOKIES");
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

  return (
    <div className="relative">
      <Sidebar initialUserProfile={userProfile} />
      <ResponsiveMainContent>
        {children}
      </ResponsiveMainContent>
    </div>
  );
} 