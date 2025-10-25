import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  rationale: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "approved" | "rejected";
}

interface ActionApprovalCardProps {
  actions: ActionItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ActionApprovalCard({ actions, onApprove, onReject }: ActionApprovalCardProps) {
  const getPriorityIcon = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const pendingActions = actions.filter((a) => a.status === "pending");

  return (
    <Card data-testid="card-action-approval">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Suggested Actions</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {pendingActions.length} pending approval
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, index) => (
          <div key={action.id}>
            <div className="space-y-3" data-testid={`action-${action.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(action.priority)}
                    <h4 className="text-sm font-medium">{action.title}</h4>
                    <Badge
                      variant={action.priority === "high" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {action.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                  <div className="bg-muted px-3 py-2 rounded-md">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">AI Rationale:</span> {action.rationale}
                    </p>
                  </div>
                </div>
              </div>

              {action.status === "pending" && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => onApprove(action.id)}
                    className="gap-2"
                    data-testid={`button-approve-${action.id}`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReject(action.id)}
                    className="gap-2"
                    data-testid={`button-reject-${action.id}`}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              )}

              {action.status === "approved" && (
                <Badge variant="secondary" className="gap-1.5">
                  <CheckCircle className="w-3 h-3" />
                  Approved
                </Badge>
              )}

              {action.status === "rejected" && (
                <Badge variant="secondary" className="gap-1.5">
                  <XCircle className="w-3 h-3" />
                  Rejected
                </Badge>
              )}
            </div>
            {index < actions.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
