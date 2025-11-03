import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Warehouse,
  Users,
  ArrowRightLeft,
  Bell,
  BarChart3,
  MessageSquare,
  Sparkles,
  FileText,
  Wifi,
  Camera,
  Mic,
  Download,
  Upload,
  Lock,
  Zap,
  Moon,
  Sun,
} from "lucide-react";

export default function Documentation() {
  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-documentation-title">
          Application Documentation
        </h1>
        <p className="text-muted-foreground" data-testid="text-documentation-description">
          Comprehensive guide to all features and capabilities of the Warehouse Inventory Management System
        </p>
      </div>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Package className="h-6 w-6" />
          Core Features
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Management
              </CardTitle>
              <CardDescription>Complete product lifecycle management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Create, read, update, and delete products</li>
                <li>SKU, barcode, and QR code support</li>
                <li>Category and supplier organization</li>
                <li>Advanced search and filtering</li>
                <li>CSV import/export for products</li>
                <li>Low stock threshold configuration</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                Warehouse Management
              </CardTitle>
              <CardDescription>Multi-location warehouse operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Manage multiple warehouse locations</li>
                <li>Track capacity and status (active/maintenance/inactive)</li>
                <li>Location and address information</li>
                <li>Row and shelf organization</li>
                <li>Real-time inventory tracking per location</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Supplier Management
              </CardTitle>
              <CardDescription>Supplier relationship management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Full CRUD operations for suppliers</li>
                <li>Contact person and details</li>
                <li>Email and phone tracking</li>
                <li>Physical address storage</li>
                <li>Link suppliers to products</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Stock Movements
              </CardTitle>
              <CardDescription>Track all inventory changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Record stock IN, OUT, TRANSFER, and ADJUSTMENT</li>
                <li>Automatic inventory level updates</li>
                <li>User and timestamp tracking</li>
                <li>Movement history and audit trail</li>
                <li>Notes and documentation support</li>
                <li>Real-time WebSocket notifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Inventory Tracking & Alerts
              </CardTitle>
              <CardDescription>Real-time stock monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Current stock levels per product and warehouse</li>
                <li>Low stock alerts and notifications</li>
                <li>Customizable threshold per product</li>
                <li>Row and shelf location tracking</li>
                <li>Real-time updates via WebSocket</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reporting & Analytics
              </CardTitle>
              <CardDescription>Data-driven insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Dashboard with Key Performance Indicators (KPIs)</li>
                <li>Total products and stock value tracking</li>
                <li>Low stock item counts</li>
                <li>Active warehouse metrics</li>
                <li>Stock level trend charts</li>
                <li>Category distribution analysis</li>
                <li>Warehouse capacity visualization</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Zap className="h-6 w-6" />
          Advanced Features
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Real-time Messaging
              </CardTitle>
              <CardDescription>Team communication built-in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Team chat for general communication</li>
                <li>Direct messaging between users</li>
                <li>Real-time message delivery via WebSocket</li>
                <li>Message history and conversation threads</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Assistant
              </CardTitle>
              <CardDescription>Intelligent inventory insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Natural language queries about inventory</li>
                <li>Context-aware responses using current data</li>
                <li>Proactive suggestions and recommendations</li>
                <li>Low stock alerts and reorder suggestions</li>
                <li>Conversational interface powered by OpenAI</li>
                <li>Text-to-speech responses for hands-free operation</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice Input
              </CardTitle>
              <CardDescription>Hands-free data entry</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Voice-to-text for form fields</li>
                <li>Search products by voice</li>
                <li>AI assistant voice queries</li>
                <li>Browser-based speech recognition</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Barcode & QR Code
              </CardTitle>
              <CardDescription>Scan and generate codes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Scan barcodes with device camera</li>
                <li>Generate barcodes for products</li>
                <li>Generate QR codes for tracking</li>
                <li>Multiple barcode format support</li>
                <li>Download and print generated codes</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Real-time Updates
              </CardTitle>
              <CardDescription>WebSocket-powered notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Live inventory level updates</li>
                <li>Stock movement notifications</li>
                <li>Product and warehouse change alerts</li>
                <li>Chat message delivery</li>
                <li>Automatic reconnection handling</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                CSV Import/Export
              </CardTitle>
              <CardDescription>Bulk data operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Import products from CSV files</li>
                <li>Export products to CSV format</li>
                <li>Template downloads for easy formatting</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Lock className="h-6 w-6" />
          Security & User Management
        </h2>

        <Card>
          <CardHeader>
            <CardTitle>Authentication & Authorization</CardTitle>
            <CardDescription>Secure access control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Username and password authentication</li>
              <li>Secure password hashing with bcrypt</li>
              <li>Session-based authentication with PostgreSQL storage</li>
              <li>Role-based access control (Admin, Manager, Staff)</li>
              <li>7-day session persistence</li>
              <li>Automatic session expiration</li>
            </ul>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">User Roles:</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="default">Admin - Full access</Badge>
                <Badge variant="secondary">Manager - Moderate access</Badge>
                <Badge variant="outline">Staff - Basic access</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Sun className="h-6 w-6" />
          <Moon className="h-6 w-6" />
          User Experience
        </h2>

        <Card>
          <CardHeader>
            <CardTitle>Progressive Web App (PWA)</CardTitle>
            <CardDescription>Install and use offline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Installable on desktop and mobile devices</li>
              <li>Service worker for offline functionality</li>
              <li>Cached assets for faster loading</li>
              <li>Works offline with cached data</li>
              <li>App-like experience on mobile</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theming & Accessibility</CardTitle>
            <CardDescription>Customizable appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Light and dark mode support</li>
              <li>System preference detection</li>
              <li>Persistent theme selection</li>
              <li>IBM Plex Sans font family</li>
              <li>Carbon Design System principles</li>
              <li>Responsive design for all screen sizes</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network & Device Information</CardTitle>
            <CardDescription>Multi-device access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>View network IP addresses</li>
              <li>Access URLs for other devices</li>
              <li>WebSocket connection details</li>
              <li>Device type identification</li>
              <li>Current user session information</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Getting Started</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium mb-1">1. Login</h4>
              <p className="text-sm text-muted-foreground">
                Use your username and password to access the system. Default admin credentials: username "admin-brad", password "admin1234"
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">2. Set Up Warehouses</h4>
              <p className="text-sm text-muted-foreground">
                Navigate to Warehouses and create your warehouse locations with capacity and status information.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">3. Add Suppliers</h4>
              <p className="text-sm text-muted-foreground">
                Create supplier records with contact information to link to your products.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">4. Import or Create Products</h4>
              <p className="text-sm text-muted-foreground">
                Add products individually or use CSV import for bulk operations. Include SKU, category, and supplier details.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">5. Track Inventory</h4>
              <p className="text-sm text-muted-foreground">
                Use Stock Movements to record IN/OUT/TRANSFER/ADJUSTMENT operations. Inventory levels update automatically.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">6. Monitor Alerts</h4>
              <p className="text-sm text-muted-foreground">
                Check the Alerts page for low stock warnings and take action to reorder products.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Technical Stack</h2>
        
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Frontend</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>React 18+ with TypeScript</li>
                  <li>Vite build system</li>
                  <li>Wouter for routing</li>
                  <li>TanStack Query for state management</li>
                  <li>shadcn/ui component library</li>
                  <li>Tailwind CSS for styling</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Backend</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Node.js with Express</li>
                  <li>PostgreSQL (Neon serverless)</li>
                  <li>Drizzle ORM</li>
                  <li>WebSocket (ws library)</li>
                  <li>Passport.js authentication</li>
                  <li>OpenAI integration</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
