import { Calendar, Users, Scale, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface ExtractedData {
  caseNumber?: string;
  parties?: string[];
  deadlines?: Array<{ date: string; description: string; priority: "high" | "medium" | "low" }>;
  keyFacts?: string[];
  confidence?: number;
}

interface ExtractedDataCardProps {
  data: ExtractedData;
}

export function ExtractedDataCard({ data }: ExtractedDataCardProps) {
  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <Card data-testid="card-extracted-data">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Extracted Information</CardTitle>
          {data.confidence && (
            <Badge variant="secondary" className="text-xs">
              {Math.round(data.confidence * 100)}% confidence
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.caseNumber && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Case Number</h4>
            </div>
            <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md" data-testid="text-case-number">
              {data.caseNumber}
            </p>
          </div>
        )}

        {data.parties && data.parties.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Parties Involved</h4>
            </div>
            <div className="space-y-1">
              {data.parties.map((party, index) => (
                <p key={index} className="text-sm pl-6" data-testid={`text-party-${index}`}>
                  {party}
                </p>
              ))}
            </div>
          </div>
        )}

        {data.deadlines && data.deadlines.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Critical Deadlines</h4>
            </div>
            <div className="space-y-3">
              {data.deadlines?.map((deadline, index) => (
                <div key={index} data-testid={`deadline-${index}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-16">
                      <Badge variant={getPriorityColor(deadline.priority)} className="text-xs">
                        {deadline.priority}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium font-mono">{deadline.date}</p>
                      <p className="text-sm text-muted-foreground mt-1">{deadline.description}</p>
                    </div>
                  </div>
                  {index < (data.deadlines?.length || 0) - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.keyFacts && data.keyFacts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Key Facts</h4>
            </div>
            <ul className="space-y-2">
              {data.keyFacts.map((fact, index) => (
                <li key={index} className="text-sm pl-6 relative before:content-['•'] before:absolute before:left-2" data-testid={`fact-${index}`}>
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
