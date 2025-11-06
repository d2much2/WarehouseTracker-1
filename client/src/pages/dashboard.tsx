import { useQuery } from "@tanstack/react-query";
import { KpiCard } from "@/components/kpi-card";
import { StockLevelChart } from "@/components/stock-level-chart";
import { RecentMovementsTable } from "@/components/recent-movements-table";
import { LowStockAlerts } from "@/components/low-stock-alerts";
import { StockMovementDialog } from "@/components/stock-movement-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Package, DollarSign, AlertTriangle, Warehouse as WarehouseIcon, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, ShoppingCart, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";

import type { StockMovement, InventoryLevel, Product, Warehouse, User } from "@shared/schema";

interface DashboardKPIs {
  totalProducts: number;
  stockValue: number;
  lowStockCount: number;
  activeWarehouses: number;
  totalOrders: number;
  pendingOrders: number;
  fulfilledOrders: number;
  totalRevenue: string;
}

type RecentMovementDTO = StockMovement & { product: Product; warehouse: Warehouse; user: User; targetWarehouse?: Warehouse };
type LowStockAlertDTO = InventoryLevel & { product: Product; warehouse: Warehouse };

export default function Dashboard() {
  const { toast } = useToast();

  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useQuery<DashboardKPIs>({
    queryKey: ["/api/dashboard/kpis"],
    retry: false,
  });

  const { data: recentMovementsData, isLoading: movementsLoading, error: movementsError } = useQuery<RecentMovementDTO[]>({
    queryKey: ["/api/stock-movements/recent"],
    retry: false,
  });

  const { data: lowStockData, isLoading: alertsLoading, error: alertsError } = useQuery<LowStockAlertDTO[]>({
    queryKey: ["/api/inventory/low-stock"],
    retry: false,
  });

  if (kpisError && isUnauthorizedError(kpisError as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  const chartData = [
    { date: "Jan", stock: 12400 },
    { date: "Feb", stock: 13200 },
    { date: "Mar", stock: 11800 },
    { date: "Apr", stock: 14500 },
    { date: "May", stock: 13900 },
    { date: "Jun", stock: 15200 },
  ];

  const formatKpiValue = (key: string, value: number) => {
    if (key === "stockValue") {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return value.toLocaleString();
  };

  const recentMovements = recentMovementsData?.map((movement) => ({
    id: movement.id,
    product: movement.product.name,
    type: movement.type,
    quantity: movement.quantity,
    warehouse: movement.warehouse.name,
    row: movement.row,
    shelf: movement.shelf,
    user: movement.user.username,
    timestamp: formatDistanceToNow(new Date(movement.createdAt), { addSuffix: true }),
  })) || [];

  const lowStockAlerts = lowStockData?.map((alert) => ({
    id: alert.id,
    product: alert.product.name,
    sku: alert.product.sku,
    currentStock: alert.quantity,
    threshold: alert.product.lowStockThreshold,
    warehouse: alert.warehouse.name,
    row: alert.row,
    shelf: alert.shelf,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your warehouse inventory system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpisLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : kpisError ? (
          <div className="col-span-full">
            <Card className="p-4">
              <p className="text-sm text-destructive">Failed to load KPIs. Please try again.</p>
            </Card>
          </div>
        ) : (
          <>
            <KpiCard
              title="Total Products"
              value={kpis?.totalProducts || 0}
              icon={Package}
            />
            <KpiCard
              title="Total Stock Value"
              value={formatKpiValue("stockValue", kpis?.stockValue || 0)}
              icon={DollarSign}
            />
            <KpiCard
              title="Low Stock Items"
              value={kpis?.lowStockCount || 0}
              icon={AlertTriangle}
            />
            <KpiCard
              title="Active Warehouses"
              value={kpis?.activeWarehouses || 0}
              icon={WarehouseIcon}
            />
          </>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Order Statistics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpisLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : kpisError ? (
            <div className="col-span-full">
              <Card className="p-4">
                <p className="text-sm text-destructive">Failed to load order statistics. Please try again.</p>
              </Card>
            </div>
          ) : (
            <>
              <KpiCard
                title="Total Orders"
                value={kpis?.totalOrders || 0}
                icon={ShoppingCart}
                data-testid="kpi-total-orders"
              />
              <KpiCard
                title="Pending Orders"
                value={kpis?.pendingOrders || 0}
                icon={Clock}
                data-testid="kpi-pending-orders"
              />
              <KpiCard
                title="Fulfilled Orders"
                value={kpis?.fulfilledOrders || 0}
                icon={CheckCircle}
                data-testid="kpi-fulfilled-orders"
              />
              <KpiCard
                title="Total Revenue"
                value={`$${parseFloat(kpis?.totalRevenue || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={TrendingUp}
                data-testid="kpi-total-revenue"
              />
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StockMovementDialog
          movementType="in"
          trigger={
            <Button data-testid="button-stock-in">
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              Stock In
            </Button>
          }
        />
        <StockMovementDialog
          movementType="out"
          trigger={
            <Button variant="outline" data-testid="button-stock-out">
              <ArrowUpFromLine className="h-4 w-4 mr-2" />
              Stock Out
            </Button>
          }
        />
        <StockMovementDialog
          movementType="transfer"
          trigger={
            <Button variant="outline" data-testid="button-transfer-stock">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfer Stock
            </Button>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StockLevelChart data={chartData} />
        </div>
        <div>
          {alertsLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <LowStockAlerts alerts={lowStockAlerts} />
          )}
        </div>
      </div>

      {movementsLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <RecentMovementsTable movements={recentMovements} />
      )}
    </div>
  );
}
