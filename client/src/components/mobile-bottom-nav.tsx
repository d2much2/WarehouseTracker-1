import { Link, useLocation } from "wouter";
import { Home, Package, AlertTriangle, ShoppingCart, ScanBarcode } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/mobile-inventory", icon: ScanBarcode, label: "Quick Check" },
  { path: "/alerts", icon: AlertTriangle, label: "Alerts" },
  { path: "/orders", icon: ShoppingCart, label: "Orders" },
  { path: "/products", icon: Package, label: "Products" },
];

export function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 hover-elevate active-elevate-2"
              data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-xs ${
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
