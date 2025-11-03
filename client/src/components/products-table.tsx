import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, MoreHorizontal, Plus, Scan } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddProductDialog } from "./add-product-dialog";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import { VoiceInputButton } from "./voice-input-button";
import { BarcodeScanner } from "./barcode-scanner";

interface ProductsTableProps {
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Product>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const deleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/kpis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const modifier = sortDirection === "asc" ? 1 : -1;
      return aVal > bVal ? modifier : -modifier;
    });

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct.mutate(productToDelete.id);
    }
  };

  const handleEdit = (product: Product) => {
    setProductToEdit(product);
    setEditDialogOpen(true);
  };

  const handleBarcodeScanned = (barcode: string) => {
    const product = products.find((p) => p.barcode === barcode);
    
    if (product) {
      setSearchTerm(barcode);
      setShowScanner(false);
      toast({
        title: "Product Found",
        description: `${product.name} (${product.sku})`,
      });
    } else {
      toast({
        title: "Product Not Found",
        description: `No product found with barcode: ${barcode}`,
        variant: "destructive",
      });
      setShowScanner(false);
    }
  };

  return (
    <div className="space-y-4">
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
            <Input
              placeholder="Search products, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 flex-1"
              data-testid="input-search-products"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setSearchTerm('');
                }
              }}
            />
            <VoiceInputButton onTranscript={(text) => setSearchTerm(text)} />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowScanner(!showScanner)}
              data-testid="button-scan-product"
              title="Scan barcode"
            >
              <Scan className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <AddProductDialog
          trigger={
            <Button data-testid="button-add-product">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          }
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {searchTerm ? "No products found matching your search." : "No products yet. Add your first product to get started."}
          </p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-sm font-medium uppercase tracking-wide">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("sku")}
                    className="h-8 px-2"
                  >
                    SKU
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("name")}
                    className="h-8 px-2"
                  >
                    Product Name
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Category</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Barcode</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("lowStockThreshold")}
                    className="h-8 px-2"
                  >
                    Threshold
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                  <TableCell className="font-mono">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.category}</TableCell>
                  <TableCell className="font-mono text-sm">{product.barcode || "-"}</TableCell>
                  <TableCell className="font-mono">{product.lowStockThreshold}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-menu-${product.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(product)} data-testid={`button-edit-${product.id}`}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(product)}
                          className="text-destructive"
                          data-testid={`button-delete-${product.id}`}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{productToDelete?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteProduct.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteProduct.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddProductDialog
        trigger={<div style={{ display: 'none' }} />}
        product={productToEdit || undefined}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setProductToEdit(null);
          }
        }}
        onSuccess={() => {
          setProductToEdit(null);
          setEditDialogOpen(false);
        }}
      />
    </div>
  );
}
