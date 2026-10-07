"use client";
import { usePathname } from "next/navigation";
import Navbar from "./navbar";
import { DesktopSidebar } from "./desktop-sidebar";
import { BottomNav } from "./bottom-nav";
import FloatingWhatsApp from "./floating-whatsapp";
import AIAssistantWidget from "./ai-assistant-widget";
import { isWorkspacePath } from "../lib/navigation";

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const workspace = isWorkspacePath(pathname);
  // Don't show floating support on print or specific minimal views if necessary
  return (
    <div className={workspace ? "mn-workspace" : "mn-public"}>
      <a href="#page-content" className="mn-skip-link no-print">
        Ir para o conteúdo
      </a>
      {workspace && <DesktopSidebar />}
      <div className={workspace ? "mn-workspace-body" : undefined}>
        <Navbar workspace={workspace} />
        <div id="page-content" tabIndex={-1} className="mn-page-content">
          {children}
        </div>
      </div>
      {workspace && <BottomNav />}
      <AIAssistantWidget />
      <FloatingWhatsApp />
    </div>
  );
}
