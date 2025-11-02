import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Movement {
  id: string;
  product: string;
  type: "in" | "out" | "transfer" | "adjustment";
  quantity: number;
  warehouse: string;
  row?: string | null;
  shelf?: string | null;
  user: string;
  timestamp: string;
}

interface RecentMovementsTableProps {
  movements: Movement[];
}

const movementTypeConfig = {
  in: { label: "Stock In", variant: "default" as const },
  out: { label: "Stock Out", variant: "secondary" as const },
  transfer: { label: "Transfer", variant: "outline" as const },
  adjustment: { label: "Adjustment", variant: "secondary" as const },
};

export function RecentMovementsTable({ movements }: RecentMovementsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Recent Stock Movements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Product</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Type</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Quantity</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Warehouse</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Location</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">User</TableHead>
                <TableHead className="text-sm font-medium uppercase tracking-wide">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id} data-testid={`row-movement-${movement.id}`}>
                  <TableCell className="font-medium">{movement.product}</TableCell>
                  <TableCell>
                    <Badge variant={movementTypeConfig[movement.type].variant}>
                      {movementTypeConfig[movement.type].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {movement.type === "out" ? "-" : "+"}{movement.quantity}
                  </TableCell>
                  <TableCell>{movement.warehouse}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {movement.row || movement.shelf ? (
                      <span>{movement.row || "—"} / {movement.shelf || "—"}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{movement.user}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{movement.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
