import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package } from "lucide-react";

interface LowStockAlert {
  id: string;
  product: string;
  sku: string;
  currentStock: number;
  threshold: number;
  warehouse: string;
  row?: string | null;
  shelf?: string | null;
}

interface LowStockAlertsProps {
  alerts: LowStockAlert[];
}

export function LowStockAlerts({ alerts }: LowStockAlertsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xl font-semibold">Low Stock Alerts</CardTitle>
          <Badge variant="destructive" data-testid="badge-alert-count">
            {alerts.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-4 p-4 rounded-md border border-border"
              data-testid={`alert-item-${alert.id}`}
            >
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-md bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium">{alert.product}</h4>
                    <p className="text-sm text-muted-foreground font-mono">{alert.sku}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {alert.warehouse}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-mono text-destructive">{alert.currentStock}</span>
                    <span className="text-muted-foreground"> / {alert.threshold} units</span>
                  </span>
                </div>
                {(alert.row || alert.shelf) && (
                  <div className="mt-1 text-xs text-muted-foreground font-mono">
                    Row: {alert.row || "—"} / Shelf: {alert.shelf || "—"}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => console.log('Reorder clicked for:', alert.product)}
                data-testid={`button-reorder-${alert.id}`}
              >
                Reorder
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
