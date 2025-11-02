import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Network, Wifi, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface NetworkInfo {
  addresses: Array<{
    name: string;
    address: string;
    family: string;
    internal: boolean;
  }>;
  port: number;
  hostname: string;
  webSocketUrl: string | null;
  httpUrl: string | null;
}

export function NetworkInfo() {
  const { toast } = useToast();
  const { data: networkInfo, isLoading } = useQuery<NetworkInfo>({
    queryKey: ["/api/network-info"],
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    });
  };

  if (isLoading) {
    return (
      <Card data-testid="card-network-info">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Information
          </CardTitle>
          <CardDescription>Loading network details...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!networkInfo) {
    return null;
  }

  return (
    <Card data-testid="card-network-info">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Network Information
        </CardTitle>
        <CardDescription>
          Connect from other devices on your local network using these addresses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wifi className="h-4 w-4" />
            Server Addresses
          </div>
          {networkInfo.addresses.length > 0 ? (
            <div className="space-y-2">
              {networkInfo.addresses.map((addr, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted"
                  data-testid={`network-address-${index}`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" data-testid={`badge-interface-${index}`}>
                        {addr.name}
                      </Badge>
                      <code className="text-sm font-mono" data-testid={`text-ip-${index}`}>
                        {addr.address}
                      </code>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {addr.family} Network Interface
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(addr.address, "IP address")}
                    data-testid={`button-copy-ip-${index}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No external network interfaces found</p>
          )}
        </div>

        {networkInfo.httpUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4" />
              Access URL
            </div>
            <div className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted">
              <code className="text-sm font-mono break-all" data-testid="text-http-url">
                {networkInfo.httpUrl}
              </code>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => copyToClipboard(networkInfo.httpUrl!, "Access URL")}
                data-testid="button-copy-url"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {networkInfo.webSocketUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wifi className="h-4 w-4" />
              WebSocket URL
            </div>
            <div className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted">
              <code className="text-sm font-mono break-all" data-testid="text-ws-url">
                {networkInfo.webSocketUrl}
              </code>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => copyToClipboard(networkInfo.webSocketUrl!, "WebSocket URL")}
                data-testid="button-copy-ws-url"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          <p className="text-sm font-medium">How to connect from another device:</p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Make sure the device is on the same local network</li>
            <li>Open a web browser on the device</li>
            <li>Navigate to the Access URL shown above</li>
            <li>Changes made on any device will appear in real-time on all connected devices</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
