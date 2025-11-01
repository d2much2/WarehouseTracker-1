import { ProductsTable } from "@/components/products-table";

export default function Products() {
  const products = [
    { id: "prod-1", sku: "WDG-001-A", name: "Industrial Widget A", category: "Components", totalStock: 450, stockStatus: "high" as const },
    { id: "prod-2", sku: "HYD-002-B", name: "Hydraulic Pump B", category: "Equipment", totalStock: 45, stockStatus: "low" as const },
    { id: "prod-3", sku: "STL-003-C", name: "Steel Beam C", category: "Materials", totalStock: 230, stockStatus: "medium" as const },
    { id: "prod-4", sku: "ELC-004-D", name: "Electric Motor D", category: "Equipment", totalStock: 890, stockStatus: "high" as const },
    { id: "prod-5", sku: "BRG-005-E", name: "Bearing Set E", category: "Components", totalStock: 12, stockStatus: "low" as const },
    { id: "prod-6", sku: "VLV-006-F", name: "Control Valve F", category: "Components", totalStock: 0, stockStatus: "out" as const },
    { id: "prod-7", sku: "CBL-007-G", name: "Heavy Duty Cable G", category: "Materials", totalStock: 1200, stockStatus: "high" as const },
    { id: "prod-8", sku: "SEN-008-H", name: "Pressure Sensor H", category: "Electronics", totalStock: 156, stockStatus: "medium" as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Products</h1>
        <p className="text-muted-foreground mt-1">Manage your product inventory</p>
      </div>

      <ProductsTable products={products} />
    </div>
  );
}
