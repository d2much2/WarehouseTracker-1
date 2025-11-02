import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { WebSocketProvider, useWebSocketContext } from "@/contexts/WebSocketContext";
import { WebSocketStatus } from "@/components/websocket-status";
import { MessagingPanel } from "@/components/messaging-panel";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Warehouses from "@/pages/warehouses";
import WarehouseDetail from "@/pages/warehouse-detail";
import Suppliers from "@/pages/suppliers";
import Movements from "@/pages/movements";
import Alerts from "@/pages/alerts";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";
import { Skeleton } from "@/components/ui/skeleton";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-96 w-96" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <>{children}</>;
}

function AuthenticatedRoutesInner() {
  const { connectionStatus } = useWebSocketContext();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3">
              <WebSocketStatus connectionStatus={connectionStatus} />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 relative">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/products" component={Products} />
              <Route path="/warehouses/:id" component={WarehouseDetail} />
              <Route path="/warehouses" component={Warehouses} />
              <Route path="/suppliers" component={Suppliers} />
              <Route path="/movements" component={Movements} />
              <Route path="/alerts" component={Alerts} />
              <Route path="/reports" component={Reports} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>

            {isChatOpen && (
              <div className="fixed bottom-6 right-6 w-[28rem] h-[36rem] shadow-2xl z-[100] rounded-lg overflow-hidden border">
                <MessagingPanel onClose={() => setIsChatOpen(false)} />
              </div>
            )}

            {!isChatOpen && (
              <Button
                className="fixed bottom-6 right-6 rounded-full h-16 w-16 shadow-2xl z-[100] hover:scale-110 transition-transform"
                size="icon"
                onClick={() => setIsChatOpen(true)}
                data-testid="button-open-chat"
              >
                <MessageSquare className="h-7 w-7" />
              </Button>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AuthenticatedRoutes() {
  return (
    <WebSocketProvider>
      <AuthenticatedRoutesInner />
    </WebSocketProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AuthGate>
            <AuthenticatedRoutes />
          </AuthGate>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
