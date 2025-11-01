import { KpiCard } from "../kpi-card";
import { Package, DollarSign, AlertTriangle, Warehouse } from "lucide-react";

export default function KpiCardExample() {
  return (
    <div className="p-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
  );
}
