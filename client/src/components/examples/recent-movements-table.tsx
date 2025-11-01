import { RecentMovementsTable } from "../recent-movements-table";

export default function RecentMovementsTableExample() {
  const movements = [
    { id: "mov-1", product: "Industrial Widget A", type: "in" as const, quantity: 500, warehouse: "Main Warehouse", user: "John Doe", timestamp: "2 hours ago" },
    { id: "mov-2", product: "Hydraulic Pump B", type: "out" as const, quantity: 150, warehouse: "North DC", user: "Jane Smith", timestamp: "4 hours ago" },
    { id: "mov-3", product: "Steel Beam C", type: "transfer" as const, quantity: 200, warehouse: "South Facility", user: "Mike Johnson", timestamp: "6 hours ago" },
  ];

  return (
    <div className="p-8">
      <RecentMovementsTable movements={movements} />
    </div>
  );
}
