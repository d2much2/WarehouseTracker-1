import { useQuery } from "@tanstack/react-query";
import { ProductsTable } from "@/components/products-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CSVUploadDialog } from "@/components/csv-upload-dialog";
import { CsvExportButton } from "@/components/csv-export-button";
import type { Product } from "@shared/schema";

export default function Products() {
  const { toast } = useToast();

  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    retry: false,
  });

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product inventory</p>
        </div>
        <div className="flex gap-2">
          <CSVUploadDialog type="products" invalidateKey="/api/products" />
          <CsvExportButton 
            endpoint="/api/csv/download/products"
            filename="products.csv"
            size="sm"
          />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : error ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-sm text-destructive">Failed to load products. Please try again.</p>
        </div>
      ) : (
        <ProductsTable products={products || []} />
      )}
    </div>
  );
}
