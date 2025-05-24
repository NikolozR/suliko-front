import "../globals.css";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative">
      <Sidebar />
      <main>
        {children}
      </main>
    </div>
  );
}
