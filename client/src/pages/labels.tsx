import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductLabel } from "@/components/product-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Printer, Tag, User } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Product, Warehouse, InventoryLevel, Customer } from "@shared/schema";

interface InventoryWithDetails extends InventoryLevel {
  product: Product;
  warehouse: Warehouse;
}

export default function Labels() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [includeCustomer, setIncludeCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const { data: inventory, isLoading: loadingInventory } = useQuery<InventoryWithDetails[]>({
    queryKey: ["/api/inventory/all-with-details"],
  });

  const { data: warehouses, isLoading: loadingWarehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: customers, isLoading: loadingCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const filteredInventory = inventory?.filter((item) => {
    const matchesSearch =
      item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWarehouse =
      selectedWarehouse === "all" || item.warehouseId === selectedWarehouse;

    return matchesSearch && matchesWarehouse;
  });

  const toggleProduct = (productId: string) => {
    const newSet = new Set(selectedProducts);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setSelectedProducts(newSet);
  };

  const selectAll = () => {
    if (filteredInventory) {
      setSelectedProducts(new Set(filteredInventory.map((item) => item.id)));
    }
  };

  const clearAll = () => {
    setSelectedProducts(new Set());
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedItems = filteredInventory?.filter((item) =>
    selectedProducts.has(item.id)
  );

  const selectedCustomer = customers?.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-6">
      <div className="no-print">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-2">Product Labels</h1>
            <p className="text-muted-foreground">
              Generate printable labels with product details, barcodes, and QR codes
            </p>
          </div>
          <Button
            onClick={handlePrint}
            disabled={selectedProducts.size === 0}
            size="lg"
            data-testid="button-print-labels"
          >
            <Printer className="h-5 w-5 mr-2" />
            Print {selectedProducts.size} Label{selectedProducts.size !== 1 ? "s" : ""}
          </Button>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Select Products
            </CardTitle>
            <CardDescription>
              Choose which products you want to print labels for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-products"
                  />
                </div>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger className="w-[200px]" data-testid="select-warehouse">
                    <SelectValue placeholder="All Warehouses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {warehouses?.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={selectAll} data-testid="button-select-all">
                  Select All
                </Button>
                <Button variant="outline" onClick={clearAll} data-testid="button-clear-all">
                  Clear All
                </Button>
              </div>

              <div className="flex items-center gap-4 p-3 border rounded-md bg-muted/30">
                <div className="flex items-center gap-2">
                  <Switch
                    id="include-customer"
                    checked={includeCustomer}
                    onCheckedChange={setIncludeCustomer}
                    data-testid="switch-include-customer"
                  />
                  <Label htmlFor="include-customer" className="font-medium cursor-pointer">
                    Include Customer Details
                  </Label>
                </div>
                {includeCustomer && (
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="w-[250px]" data-testid="select-customer">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="border rounded-md max-h-[400px] overflow-auto">
              {loadingInventory || loadingWarehouses ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading products...
                </div>
              ) : filteredInventory && filteredInventory.length > 0 ? (
                <div className="divide-y">
                  {filteredInventory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 hover-elevate cursor-pointer"
                      onClick={() => toggleProduct(item.id)}
                      data-testid={`row-product-${item.id}`}
                    >
                      <Checkbox
                        checked={selectedProducts.has(item.id)}
                        onCheckedChange={(checked) => {
                          toggleProduct(item.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`checkbox-${item.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {item.product.sku} • {item.warehouse.name}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.product.barcode ? "Barcode" : "No barcode"} •{" "}
                        {item.product.qrCode ? "QR" : "No QR"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No products found
                </div>
              )}
            </div>

            {selectedProducts.size > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedProducts.size} product{selectedProducts.size !== 1 ? "s" : ""} selected
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedItems && selectedItems.length > 0 && (
        <>
          <Card className="no-print">
            <CardHeader>
              <CardTitle>Label Preview</CardTitle>
              <CardDescription>
                Review the {selectedItems.length} label{selectedItems.length !== 1 ? "s" : ""} before printing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedItems.map((item) => (
                  <ProductLabel
                    key={item.id}
                    product={item.product}
                    warehouse={item.warehouse}
                    inventory={{ row: item.row, shelf: item.shelf }}
                    customer={includeCustomer ? selectedCustomer : undefined}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="print-only">
            <div className="labels-grid">
              {selectedItems.map((item) => (
                <ProductLabel
                  key={item.id}
                  product={item.product}
                  warehouse={item.warehouse}
                  inventory={{ row: item.row, shelf: item.shelf }}
                  customer={includeCustomer ? selectedCustomer : undefined}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
