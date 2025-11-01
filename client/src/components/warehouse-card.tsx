import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Package } from "lucide-react";

interface WarehouseCardProps {
  id: string;
  name: string;
  location: string;
  totalProducts: number;
  stockValue: number;
  capacity: number;
  currentOccupancy: number;
  status: "active" | "maintenance" | "inactive";
}

const statusConfig = {
  active: { label: "Active", color: "bg-green-500" },
  maintenance: { label: "Maintenance", color: "bg-yellow-500" },
  inactive: { label: "Inactive", color: "bg-gray-500" },
};

export function WarehouseCard({
  id,
  name,
  location,
  totalProducts,
  stockValue,
  capacity,
  currentOccupancy,
  status,
}: WarehouseCardProps) {
  const occupancyPercentage = (currentOccupancy / capacity) * 100;

  return (
    <Card className="hover-elevate cursor-pointer" onClick={() => console.log('Warehouse clicked:', name)} data-testid={`card-warehouse-${id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${statusConfig[status].color}`} />
            <span className="text-xs text-muted-foreground">{statusConfig[status].label}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{location}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Products</p>
            <p className="text-2xl font-semibold mt-1">{totalProducts}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Stock Value</p>
            <p className="text-2xl font-semibold mt-1">${stockValue.toLocaleString()}</p>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Capacity</span>
            </div>
            <span className="text-sm font-mono">{occupancyPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={occupancyPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {currentOccupancy.toLocaleString()} / {capacity.toLocaleString()} units
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
