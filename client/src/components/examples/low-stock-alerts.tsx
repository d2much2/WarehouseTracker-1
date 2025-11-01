import { LowStockAlerts } from "../low-stock-alerts";

export default function LowStockAlertsExample() {
  const alerts = [
    { id: "alert-1", product: "Industrial Widget A", sku: "WDG-001-A", currentStock: 45, threshold: 100, warehouse: "Main Warehouse" },
    { id: "alert-2", product: "Hydraulic Pump B", sku: "HYD-002-B", currentStock: 12, threshold: 50, warehouse: "North DC" },
    { id: "alert-3", product: "Steel Beam C", sku: "STL-003-C", currentStock: 8, threshold: 25, warehouse: "South Facility" },
  ];

  return (
    <div className="p-8 max-w-md">
      <LowStockAlerts alerts={alerts} />
    </div>
  );
}
