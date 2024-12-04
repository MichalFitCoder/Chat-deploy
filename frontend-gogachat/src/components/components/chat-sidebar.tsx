import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth.context";
import { getChats } from "@/services/chat.service";
import { TChat } from "@/types/chat.types";
import { useEffect, useState } from "react";

export function ChatSidebar() {
  // TODO There is a problem with loading user data after page reload, please correct this, it should read data from localstorage if user is logged in
  // useAuth() has some issues with reading data correctly
  const { user } = useAuth();
  const [chats, setChats] = useState<TChat[] | null>([]);

  useEffect(() => {
    const fetchChats = async () => {
      if (user) {
        const data = await getChats(user.id);
        setChats(data);
      }
    };
    fetchChats();
  }, []);

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats?.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton asChild>
                    <a href={`/chat/${chat.id}`}>
                      <span>{chat.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
