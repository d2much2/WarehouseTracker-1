import { Warehouse, Package, BarChart3 } from "lucide-react";

export function LoadingPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 animate-ping rounded-full bg-primary/20"></div>
          </div>
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <Warehouse className="h-12 w-12 text-primary animate-pulse" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Loading Warehouse System</h2>
          <p className="text-muted-foreground">Preparing your inventory dashboard...</p>
        </div>
        
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span>Products</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Warehouse className="h-4 w-4 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span>Warehouses</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4 animate-bounce" style={{ animationDelay: "300ms" }} />
            <span>Analytics</span>
          </div>
        </div>
        
        <div className="flex gap-1 mt-6">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0ms" }}></div>
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "150ms" }}></div>
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  );
}
