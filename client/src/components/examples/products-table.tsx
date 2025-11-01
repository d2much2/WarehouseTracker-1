import { ProductsTable } from "../products-table";

export default function ProductsTableExample() {
  const products = [
    { id: "prod-1", sku: "WDG-001-A", name: "Industrial Widget A", category: "Components", totalStock: 450, stockStatus: "high" as const },
    { id: "prod-2", sku: "HYD-002-B", name: "Hydraulic Pump B", category: "Equipment", totalStock: 45, stockStatus: "low" as const },
    { id: "prod-3", sku: "STL-003-C", name: "Steel Beam C", category: "Materials", totalStock: 230, stockStatus: "medium" as const },
    { id: "prod-4", sku: "ELC-004-D", name: "Electric Motor D", category: "Equipment", totalStock: 890, stockStatus: "high" as const },
  ];

  return (
    <div className="p-8">
      <ProductsTable products={products} />
    </div>
  );
}
