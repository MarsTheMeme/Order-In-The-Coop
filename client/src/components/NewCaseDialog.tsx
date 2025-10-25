import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NewCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCase: (caseName: string) => void;
  isCreating: boolean;
}

export function NewCaseDialog({ open, onOpenChange, onCreateCase, isCreating }: NewCaseDialogProps) {
  const [caseName, setCaseName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (caseName.trim()) {
      onCreateCase(caseName.trim());
      setCaseName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-new-case">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
          <DialogDescription>
            Enter a name for your new case. A case number will be generated automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="case-name">Case Name</Label>
            <Input
              id="case-name"
              placeholder="e.g., Johnson v. MegaCorp"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              disabled={isCreating}
              data-testid="input-case-name"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
              data-testid="button-cancel-case"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!caseName.trim() || isCreating}
              data-testid="button-create-case"
            >
              {isCreating ? "Creating..." : "Create Case"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
