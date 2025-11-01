import { WarehouseCard } from "@/components/warehouse-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Warehouses() {
  const warehouses = [
    {
      id: "wh-1",
      name: "Main Warehouse",
      location: "New York, NY",
      totalProducts: 1247,
      stockValue: 2400000,
      capacity: 50000,
      currentOccupancy: 35000,
      status: "active" as const,
    },
    {
      id: "wh-2",
      name: "North Distribution Center",
      location: "Boston, MA",
      totalProducts: 892,
      stockValue: 1800000,
      capacity: 40000,
      currentOccupancy: 28000,
      status: "active" as const,
    },
    {
      id: "wh-3",
      name: "South Storage Facility",
      location: "Atlanta, GA",
      totalProducts: 654,
      stockValue: 1200000,
      capacity: 35000,
      currentOccupancy: 18000,
      status: "active" as const,
    },
    {
      id: "wh-4",
      name: "West Coast Hub",
      location: "Los Angeles, CA",
      totalProducts: 1089,
      stockValue: 2100000,
      capacity: 45000,
      currentOccupancy: 32000,
      status: "maintenance" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Warehouses</h1>
          <p className="text-muted-foreground mt-1">Manage warehouse locations and capacity</p>
        </div>
        <Button onClick={() => console.log('Add warehouse clicked')} data-testid="button-add-warehouse">
          <Plus className="h-4 w-4 mr-2" />
          Add Warehouse
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {warehouses.map((warehouse) => (
          <WarehouseCard key={warehouse.id} {...warehouse} />
        ))}
      </div>
    </div>
  );
}
