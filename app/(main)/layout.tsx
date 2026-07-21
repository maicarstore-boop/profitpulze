import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden md:h-auto md:min-h-full md:overflow-visible">
      <Navbar />
      <main className="flex-1 overflow-y-auto md:overflow-visible">
        {children}
        <Footer />
      </main>
      <BottomTabBar />
    </div>
  );
}
