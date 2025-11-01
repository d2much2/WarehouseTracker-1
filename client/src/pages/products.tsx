import { useQuery } from "@tanstack/react-query";
import { ProductsTable } from "@/components/products-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Products() {
  const { toast } = useToast();

  const { data: products, isLoading, error } = useQuery({
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
      <div>
        <h1 className="text-3xl font-semibold">Products</h1>
        <p className="text-muted-foreground mt-1">Manage your product inventory</p>
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
