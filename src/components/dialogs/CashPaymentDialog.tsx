import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Calculator } from "lucide-react";

interface CashPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onConfirm: () => void;
}

export function CashPaymentDialog({
  open,
  onOpenChange,
  totalAmount,
  onConfirm
}: CashPaymentDialogProps) {
  const [amountReceived, setAmountReceived] = useState("");
  
  const receivedValue = parseFloat(amountReceived) || 0;
  const change = receivedValue - totalAmount;
  const isValid = receivedValue >= totalAmount;

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
      onOpenChange(false);
      setAmountReceived("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cash Payment
          </DialogTitle>
          <DialogDescription>
            Enter the amount received from customer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Total Amount Due</Label>
            <div className="text-2xl font-bold text-primary">
              GH₵ {totalAmount.toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount-received">Amount Received</Label>
            <Input
              id="amount-received"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              className="text-lg"
              autoFocus
            />
          </div>

          {amountReceived && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Change to Return:</span>
                <span className={`text-xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <Calculator className="inline h-4 w-4 mr-1" />
                  GH₵ {Math.abs(change).toFixed(2)}
                </span>
              </div>
              {!isValid && (
                <p className="text-xs text-red-600">
                  ⚠️ Insufficient amount received
                </p>
              )}
            </div>
          )}

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[50, 100, 200].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setAmountReceived(amount.toString())}
                className="text-sm"
              >
                GH₵ {amount}
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setAmountReceived("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid}
            className="bg-green-600 hover:bg-green-700"
          >
            Complete Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
