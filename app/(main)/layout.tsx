import { Navbar } from "@/components/layout/navbar";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { Footer } from "@/components/layout/footer";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { SupportChatWidget } from "@/components/support/support-chat-widget";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <Navbar />
      <AnnouncementBanner />
      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-hidden md:overflow-y-auto md:pb-0">
        <div className="w-full min-w-0 pb-20 md:pb-0">{children}</div>
        <Footer />
      </main>
      <BottomTabBar />
      <SupportChatWidget />
    </div>
  );
}
