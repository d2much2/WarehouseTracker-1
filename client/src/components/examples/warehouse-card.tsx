import { WarehouseCard } from "../warehouse-card";

export default function WarehouseCardExample() {
  return (
    <div className="p-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl">
      <WarehouseCard
        id="wh-1"
        name="Main Warehouse"
        location="New York, NY"
        totalProducts={1247}
        stockValue={2400000}
        capacity={50000}
        currentOccupancy={35000}
        status="active"
      />
      <WarehouseCard
        id="wh-2"
        name="North Distribution Center"
        location="Boston, MA"
        totalProducts={892}
        stockValue={1800000}
        capacity={40000}
        currentOccupancy={28000}
        status="active"
      />
      <WarehouseCard
        id="wh-3"
        name="West Coast Hub"
        location="Los Angeles, CA"
        totalProducts={1089}
        stockValue={2100000}
        capacity={45000}
        currentOccupancy={32000}
        status="maintenance"
      />
    </div>
  );
}
