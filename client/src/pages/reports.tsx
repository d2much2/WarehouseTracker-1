import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Package, TrendingUp, AlertTriangle, Warehouse } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Reports() {
  const { toast } = useToast();

  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useQuery({
    queryKey: ["/api/dashboard/kpis"],
    retry: false,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    retry: false,
  });

  const { data: warehouses, isLoading: warehousesLoading } = useQuery({
    queryKey: ["/api/warehouses"],
    retry: false,
  });

  const { data: lowStockData } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    retry: false,
  });

  if (kpisError && isUnauthorizedError(kpisError as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  const isLoading = kpisLoading || productsLoading || warehousesLoading;

  const categoryData = products?.reduce((acc: any[], product: any) => {
    const existing = acc.find(item => item.name === product.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: product.category, value: 1 });
    }
    return acc;
  }, []) || [];

  const warehouseData = warehouses?.map((warehouse: any) => ({
    name: warehouse.name,
    capacity: warehouse.capacity,
    status: warehouse.status === 'active' ? 1 : 0,
  })) || [];

  const stockTrendData = [
    { month: "Jan", stock: 12400 },
    { month: "Feb", stock: 13200 },
    { month: "Mar", stock: 11800 },
    { month: "Apr", stock: 14500 },
    { month: "May", stock: 13900 },
    { month: "Jun", stock: 15200 },
  ];

  const kpiCards = [
    {
      title: "Total Products",
      value: kpis?.totalProducts || 0,
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Stock Value",
      value: `$${((kpis?.stockValue || 0) / 1000).toFixed(1)}K`,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Low Stock Items",
      value: kpis?.lowStockCount || 0,
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      title: "Active Warehouses",
      value: kpis?.activeWarehouses || 0,
      icon: Warehouse,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Insights and trends for your inventory</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((kpi, index) => (
            <Card key={index} data-testid={`card-kpi-${kpi.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="card-stock-trend">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Stock Level Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stockTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="stock" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-category-distribution">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : categoryData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No category data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-warehouse-capacity">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Warehouse Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : warehouseData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No warehouse data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={warehouseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="capacity" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-alerts-summary">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Alerts Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 p-4 rounded-md bg-destructive/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="font-medium">Low Stock Alerts</span>
                </div>
                <span className="text-2xl font-semibold text-destructive">
                  {lowStockData?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 p-4 rounded-md bg-blue-500/10">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Total Products</span>
                </div>
                <span className="text-2xl font-semibold text-blue-600">
                  {products?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 p-4 rounded-md bg-green-500/10">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Active Warehouses</span>
                </div>
                <span className="text-2xl font-semibold text-green-600">
                  {warehouses?.filter((w: any) => w.status === 'active').length || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
