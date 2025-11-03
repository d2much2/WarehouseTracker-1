import {
  LayoutDashboard,
  Package,
  Warehouse,
  Users,
  BarChart3,
  Settings,
  ArrowRightLeft,
  Bell,
  LogOut,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Monitor, Globe } from "lucide-react";

const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
  },
  {
    title: "Warehouses",
    url: "/warehouses",
    icon: Warehouse,
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Users,
  },
  {
    title: "Stock Movements",
    url: "/movements",
    icon: ArrowRightLeft,
  },
  {
    title: "Alerts",
    url: "/alerts",
    icon: Bell,
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageSquare,
  },
  {
    title: "AI Assistant",
    url: "/ai-assistant",
    icon: Sparkles,
  },
];

const bottomMenuItems = [
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: deviceInfo } = useQuery<{ ip: string; userAgent: string }>({
    queryKey: ["/api/device-info"],
    staleTime: 5 * 60 * 1000,
  });

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getDeviceName = (userAgent: string) => {
    if (!userAgent) return "Unknown Device";
    
    if (userAgent.includes("Windows")) return "Windows PC";
    if (userAgent.includes("Mac")) return "Mac";
    if (userAgent.includes("Linux")) return "Linux PC";
    if (userAgent.includes("Android")) return "Android Device";
    if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS Device";
    
    return "Unknown Device";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-4 space-y-4 border-b">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || "User"} />
              <AvatarFallback>
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate" data-testid="text-user-name">
                {user?.firstName} {user?.lastName}
              </span>
              <Badge variant="secondary" className="w-fit text-xs" data-testid="badge-user-role">
                {user?.role}
              </Badge>
            </div>
          </div>
          
          {deviceInfo && (
            <div className="space-y-2 text-xs text-muted-foreground border-t pt-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-3 w-3 flex-shrink-0" />
                <span className="truncate" data-testid="text-device-name">
                  {getDeviceName(deviceInfo.userAgent)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-3 w-3 flex-shrink-0" />
                <span className="truncate font-mono" data-testid="text-device-ip">
                  {deviceInfo.ip}
                </span>
              </div>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Inventory Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
