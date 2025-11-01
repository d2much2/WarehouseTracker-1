import { KpiCard } from "@/components/kpi-card";
import { StockLevelChart } from "@/components/stock-level-chart";
import { RecentMovementsTable } from "@/components/recent-movements-table";
import { LowStockAlerts } from "@/components/low-stock-alerts";
import { StockMovementDialog } from "@/components/stock-movement-dialog";
import { Button } from "@/components/ui/button";
import { Package, DollarSign, AlertTriangle, Warehouse, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft } from "lucide-react";

export default function Dashboard() {
  const chartData = [
    { date: "Jan", stock: 12400 },
    { date: "Feb", stock: 13200 },
    { date: "Mar", stock: 11800 },
    { date: "Apr", stock: 14500 },
    { date: "May", stock: 13900 },
    { date: "Jun", stock: 15200 },
  ];

  const recentMovements = [
    { id: "mov-1", product: "Industrial Widget A", type: "in" as const, quantity: 500, warehouse: "Main Warehouse", user: "John Doe", timestamp: "2 hours ago" },
    { id: "mov-2", product: "Hydraulic Pump B", type: "out" as const, quantity: 150, warehouse: "North DC", user: "Jane Smith", timestamp: "4 hours ago" },
    { id: "mov-3", product: "Steel Beam C", type: "transfer" as const, quantity: 200, warehouse: "South Facility", user: "Mike Johnson", timestamp: "6 hours ago" },
    { id: "mov-4", product: "Electric Motor D", type: "in" as const, quantity: 300, warehouse: "Main Warehouse", user: "Sarah Lee", timestamp: "8 hours ago" },
    { id: "mov-5", product: "Bearing Set E", type: "adjustment" as const, quantity: 50, warehouse: "North DC", user: "Tom Wilson", timestamp: "10 hours ago" },
  ];

  const lowStockAlerts = [
    { id: "alert-1", product: "Industrial Widget A", sku: "WDG-001-A", currentStock: 45, threshold: 100, warehouse: "Main Warehouse" },
    { id: "alert-2", product: "Hydraulic Pump B", sku: "HYD-002-B", currentStock: 12, threshold: 50, warehouse: "North DC" },
    { id: "alert-3", product: "Steel Beam C", sku: "STL-003-C", currentStock: 8, threshold: 25, warehouse: "South Facility" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your warehouse inventory system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Products"
          value="1,247"
          icon={Package}
          trend={{ value: 12, isPositive: true }}
        />
        <KpiCard
          title="Total Stock Value"
          value="$2.4M"
          icon={DollarSign}
          trend={{ value: 8, isPositive: true }}
        />
        <KpiCard
          title="Low Stock Items"
          value="23"
          icon={AlertTriangle}
          trend={{ value: 15, isPositive: false }}
        />
        <KpiCard
          title="Active Warehouses"
          value="8"
          icon={Warehouse}
        />
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
          <LowStockAlerts alerts={lowStockAlerts} />
        </div>
      </div>

      <RecentMovementsTable movements={recentMovements} />
    </div>
  );
}
