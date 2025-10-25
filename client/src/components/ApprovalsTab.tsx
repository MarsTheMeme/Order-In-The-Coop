import { CheckCircle, AlertTriangle, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ApprovedAction {
  action: {
    id: number;
    title: string;
    description: string;
    rationale: string;
    priority: "high" | "medium" | "low";
    status: string;
    updatedAt: Date;
  };
  case: {
    id: number;
    name: string;
    caseNumber: string;
  };
  document: {
    fileName: string;
  };
}

interface ApprovalsTabProps {
  approvals: ApprovedAction[];
  isLoading?: boolean;
}

export function ApprovalsTab({ approvals, isLoading }: ApprovalsTabProps) {
  const groupedApprovals = approvals.reduce((acc, approval) => {
    const caseId = approval.case.id;
    if (!acc[caseId]) {
      acc[caseId] = {
        case: approval.case,
        actions: [],
      };
    }
    acc[caseId].actions.push(approval);
    return acc;
  }, {} as Record<number, { case: ApprovedAction['case']; actions: ApprovedAction[] }>);

  const getPriorityIcon = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading approvals...</p>
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <CheckCircle className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <h3 className="font-medium text-lg">No Approved Actions</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Approved actions will appear here as reminders
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="approvals-tab">
      {Object.values(groupedApprovals).map(({ case: caseInfo, actions }) => (
        <Card key={caseInfo.id} data-testid={`approvals-case-${caseInfo.id}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{caseInfo.name}</CardTitle>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                  {caseInfo.caseNumber}
                </p>
              </div>
              <Badge variant="secondary" className="gap-1.5">
                <CheckCircle className="w-3 h-3" />
                {actions.length} approved
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
                {actions.map((approval, index) => (
                  <div key={approval.action.id}>
                    <div className="space-y-3" data-testid={`approval-${approval.action.id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(approval.action.priority)}
                            <h4 className="text-sm font-medium">
                              {approval.action.title}
                            </h4>
                            <Badge
                              variant={
                                approval.action.priority === "high"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {approval.action.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {approval.action.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3 h-3" />
                              {approval.document.fileName}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              Approved{" "}
                              {new Date(approval.action.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="bg-muted px-3 py-2 rounded-md">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">AI Rationale:</span>{" "}
                              {approval.action.rationale}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < actions.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
