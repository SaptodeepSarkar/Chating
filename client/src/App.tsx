// client/src/App.tsx
import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Auth from "@/pages/Auth";
import Chat from "@/pages/Chat";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import type { User } from "@shared/schema";

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [totalUnread, setTotalUnread] = useState<number>(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("chatUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    document.title = currentUser ? `${currentUser.username} - Chaters by Saptodeep Sarkar` : 'Chaters by Saptodeep Sarkar';
    
    if (currentUser && totalUnread > 0) {
      document.title = `(${totalUnread}) ${currentUser.username} - Chaters`;
    }
  }, [currentUser, totalUnread]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const handleLogin = (user: { id: string; username: string }) => {
    const fullUser: User = {
      ...user,
      password: '',
      status: 'online',
      lastSeen: null,
      profilePicture: '', // Initialize profile picture
    };
    setCurrentUser(fullUser);
    localStorage.setItem("chatUser", JSON.stringify(fullUser));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setTotalUnread(0);
    localStorage.removeItem("chatUser");
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors shadow-sm"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Settings Button */}
        {currentUser && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open('/account.html', '_blank')}
            className="fixed top-4 right-16 z-50 p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors shadow-sm"
            aria-label="Account settings"
          >
            <Settings className="w-5 h-5" />
          </Button>
        )}

        {/* Notification Badge */}
        {currentUser && totalUnread > 0 && (
          <div className="fixed top-4 right-32 z-50">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shadow-lg animate-pulse">
                {totalUnread > 99 ? '99+' : totalUnread}
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            </div>
          </div>
        )}

        <Switch>
          <Route path="/">
            {currentUser ? (
              <Chat user={currentUser} onLogout={handleLogout} onUnreadCountChange={setTotalUnread} />
            ) : (
              <Auth onLogin={handleLogin} />
            )}
          </Route>
          <Route path="/auth">
            <Auth onLogin={handleLogin} />
          </Route>
          <Route path="/chat">
            {currentUser ? (
              <Chat user={currentUser} onLogout={handleLogout} onUnreadCountChange={setTotalUnread} />
            ) : (
              <Auth onLogin={handleLogin} />
            )}
          </Route>
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;