import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Smartphone, Monitor, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function NetworkAccessInfo() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const appUrl = window.location.origin;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    toast({
      title: "URL Copied!",
      description: "Share this link to access the app from any device",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Network Access
        </CardTitle>
        <CardDescription>
          Access this application from any device on the network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <code className="flex-1 text-sm font-mono break-all">{appUrl}</code>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            data-testid="button-copy-url"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="grid gap-3">
          <div className="flex items-start gap-3 text-sm">
            <Monitor className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Desktop/Laptop</p>
              <p className="text-muted-foreground">Open the URL above in any browser</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 text-sm">
            <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Mobile Device</p>
              <p className="text-muted-foreground">Scan QR code or type the URL in mobile browser</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 text-sm">
            <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Any Network Location</p>
              <p className="text-muted-foreground">Access from anywhere with internet connection</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
