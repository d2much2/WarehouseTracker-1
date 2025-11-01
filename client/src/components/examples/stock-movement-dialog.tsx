import { StockMovementDialog } from "../stock-movement-dialog";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft } from "lucide-react";

export default function StockMovementDialogExample() {
  return (
    <div className="p-8 flex flex-wrap gap-4">
      <StockMovementDialog
        movementType="in"
        trigger={
          <Button>
            <ArrowDownToLine className="h-4 w-4 mr-2" />
            Stock In
          </Button>
        }
      />
      <StockMovementDialog
        movementType="out"
        trigger={
          <Button variant="outline">
            <ArrowUpFromLine className="h-4 w-4 mr-2" />
            Stock Out
          </Button>
        }
      />
      <StockMovementDialog
        movementType="transfer"
        trigger={
          <Button variant="outline">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer Stock
          </Button>
        }
      />
    </div>
  );
}
