import { SidebarProvider } from "@/components/ui/sidebar"
import { ChatSidebar } from "../components/components/chat-sidebar"


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex w-full h-full"> 
        <ChatSidebar />
        <main className="flex-1 w-full"> 
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
