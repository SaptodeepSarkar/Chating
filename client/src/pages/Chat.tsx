import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/Avatar";
import { UserList } from "@/components/UserList";
import { ChatArea } from "@/components/ChatArea";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { User, UserWithStatus, Message } from "@shared/schema";

interface ChatProps {
  user: User;
  onLogout: () => void;
}

export default function Chat({ user, onLogout }: ChatProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: usersData } = useQuery<UserWithStatus[]>({
    queryKey: ["/api/users"],
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (usersData) {
      setUsers(usersData);
    }
  }, [usersData]);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "auth", userId: user.id }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "message") {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === "userStatus") {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === data.userId ? { ...u, online: data.online } : u
          )
        );
      } else if (data.type === "messages") {
        setMessages(data.messages);
      }
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [user.id]);

  useEffect(() => {
    if (selectedUserId && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "getMessages", otherUserId: selectedUserId }));
    }
  }, [selectedUserId, ws]);

  const handleSendMessage = useCallback(
    async (content: string, file?: File) => {
      if (!selectedUserId) return;

      let fileUrl, fileName, fileType, fileSize;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("receiverId", selectedUserId);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          fileUrl = result.fileUrl;
          fileName = result.fileName;
          fileType = result.fileType;
          fileSize = result.fileSize;
        }
      }

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "sendMessage",
            receiverId: selectedUserId,
            content: content || undefined,
            fileUrl,
            fileName,
            fileType,
            fileSize,
          })
        );
      }
    },
    [selectedUserId, ws]
  );

  const handleSendFile = useCallback(
    async (file: File) => {
      handleSendMessage("", file);
    },
    [handleSendMessage]
  );

  const conversationMessages = messages.filter(
    (msg) =>
      (msg.senderId === user.id && msg.receiverId === selectedUserId) ||
      (msg.senderId === selectedUserId && msg.receiverId === user.id)
  );

  return (
    <div className="flex h-screen bg-background">
      <div
        className={cn(
          "w-80 border-r bg-card flex flex-col transition-all lg:relative absolute inset-y-0 left-0 z-40",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar username={user.username} size="md" online={true} />
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold truncate" data-testid="text-current-username">
                {user.username}
              </p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={onLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
              data-testid="button-close-sidebar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <UserList
          users={users}
          currentUserId={user.id}
          selectedUserId={selectedUserId}
          onSelectUser={(userId) => {
            setSelectedUserId(userId);
            setSidebarOpen(false);
          }}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <Button
          size="icon"
          variant="ghost"
          className="lg:hidden m-2 absolute top-0 left-0 z-30"
          onClick={() => setSidebarOpen(true)}
          data-testid="button-open-sidebar"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <ChatArea
          currentUser={user}
          recipient={selectedUser}
          messages={conversationMessages}
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
        />
      </div>
    </div>
  );
}
