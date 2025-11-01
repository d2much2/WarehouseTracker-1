import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Alerts() {
  const { toast } = useToast();

  const { data: lowStockData, isLoading, error } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    retry: false,
  });

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  const lowStockAlerts = lowStockData?.map((alert: any) => ({
    id: alert.id,
    product: alert.product.name,
    sku: alert.product.sku,
    currentStock: alert.quantity,
    threshold: alert.product.lowStockThreshold,
    warehouse: alert.warehouseId,
    productId: alert.productId,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Low Stock Alerts</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage items running low on stock</p>
        </div>
        <Badge variant="destructive" data-testid="badge-alert-count">
          {lowStockAlerts.length} Alerts
        </Badge>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : error ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-sm text-destructive">Failed to load alerts. Please try again.</p>
        </div>
      ) : lowStockAlerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <Package className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No Low Stock Alerts</p>
              <p className="text-sm text-muted-foreground">All products are adequately stocked</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lowStockAlerts.map((alert: any) => (
            <Card key={alert.id} data-testid={`card-alert-${alert.id}`}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-md bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold">{alert.product}</CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">{alert.sku}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Warehouse</p>
                  <Badge variant="outline" className="text-xs">
                    {alert.warehouse}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Stock Level</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold font-mono text-destructive">
                      {alert.currentStock}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {alert.threshold} units
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-destructive/20 rounded-full h-2">
                    <div
                      className="bg-destructive h-2 rounded-full"
                      style={{ width: `${(alert.currentStock / alert.threshold) * 100}%` }}
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => toast({ title: "Coming Soon", description: "Reorder functionality will be added." })}
                  data-testid={`button-reorder-${alert.id}`}
                >
                  Reorder Stock
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
