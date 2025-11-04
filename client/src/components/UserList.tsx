import { useState, useMemo } from "react";
import { Avatar } from "./Avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserWithStatus } from "@shared/schema";

interface UserListProps {
  users: UserWithStatus[];
  currentUserId: string;
  selectedUserId?: string;
  onSelectUser: (userId: string) => void;
}

export function UserList({ users, currentUserId, selectedUserId, onSelectUser }: UserListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const formatLastSeen = (lastSeen: Date | null) => {
    if (!lastSeen) return "Never";
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => user.id !== currentUserId)
      .filter((user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        // Sort by online status first, then by unread count, then by username
        if (a.online !== b.online) return a.online ? -1 : 1;
        if (a.unreadCount !== b.unreadCount) return (b.unreadCount || 0) - (a.unreadCount || 0);
        return a.username.localeCompare(b.username);
      });
  }, [users, currentUserId, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-users"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground" data-testid="text-no-users">
            {searchQuery ? "No users found" : "No other users online"}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelectUser(user.id)}
                className={cn(
                  "w-full p-3 rounded-lg flex items-center gap-3 text-left transition-colors hover-elevate active-elevate-2",
                  selectedUserId === user.id && "bg-accent"
                )}
                data-testid={`user-item-${user.id}`}
              >
                <Avatar username={user.username} size="md" online={user.online} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" data-testid={`text-username-${user.id}`}>
                    {user.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.online ? "Online" : `Offline - last seen: ${formatLastSeen(user.lastSeen)}`}
                  </p>
                </div>
                {user.unreadCount && user.unreadCount > 0 && (
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium animate-pulse" data-testid={`badge-unread-${user.id}`}>
                      {user.unreadCount > 99 ? '99+' : user.unreadCount}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}