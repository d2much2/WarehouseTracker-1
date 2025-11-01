import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Warehouse, BarChart3, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Warehouse IMS</span>
          </div>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Log In</a>
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold">
              Warehouse Inventory Management System
            </h1>
            <p className="text-xl text-muted-foreground">
              Multi-location tracking, real-time stock movements, and comprehensive reporting for enterprise operations
            </p>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild data-testid="button-get-started">
              <a href="/api/login">Get Started</a>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-16">
            <Card>
              <CardHeader>
                <Package className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Product Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track products with SKU, barcode, categories, and supplier information
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Warehouse className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Multi-Location</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Manage inventory across multiple warehouse locations with capacity tracking
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Real-Time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get insights with dashboards, reports, and low stock alerts
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Role-Based Access</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Secure access with admin, manager, and staff permission levels
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Warehouse Inventory Management System
        </div>
      </footer>
    </div>
  );
}
