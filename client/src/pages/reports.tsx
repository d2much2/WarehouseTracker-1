import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Reports</h1>
        <p className="text-muted-foreground mt-1">Analytics and insights for your inventory</p>
      </div>

      <Card>
        <CardContent className="p-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Reports Coming Soon</h2>
              <p className="text-muted-foreground mt-2 max-w-md">
                Advanced analytics, inventory reports, and performance insights will be available here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
