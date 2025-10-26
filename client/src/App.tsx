import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Auth from "@/pages/Auth";
import Chat from "@/pages/Chat";
import type { User } from "@shared/schema";

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("chatUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("chatUser", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("chatUser");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/">
            {currentUser ? (
              <Chat user={currentUser} onLogout={handleLogout} />
            ) : (
              <Auth onLogin={handleLogin} />
            )}
          </Route>
          <Route path="/auth">
            <Auth onLogin={handleLogin} />
          </Route>
          <Route path="/chat">
            {currentUser ? (
              <Chat user={currentUser} onLogout={handleLogout} />
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
