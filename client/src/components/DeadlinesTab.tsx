import { useQuery } from "@tanstack/react-query";
import { CustomCalendar } from "./CustomCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { format, parseISO, isSameDay } from "date-fns";

type Deadline = {
  date: string;
  description: string;
  priority: "high" | "medium" | "low";
  caseName: string;
  caseId: number;
  caseNumber: string;
  documentName: string;
};

export function DeadlinesTab() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: deadlines = [], isLoading } = useQuery<Deadline[]>({
    queryKey: ["/api/deadlines"],
  });

  const selectedDateDeadlines = deadlines.filter((d) => {
    try {
      const deadlineDate = parseISO(d.date);
      return isSameDay(deadlineDate, selectedDate);
    } catch {
      const deadlineDate = new Date(d.date);
      return isSameDay(deadlineDate, selectedDate);
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="deadlines-loading">
        <div className="text-muted-foreground">Loading deadlines...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full p-6" data-testid="deadlines-tab">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Deadline Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <CustomCalendar
            deadlines={deadlines}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>
            {selectedDate
              ? `Deadlines for ${format(selectedDate, "MMMM d, yyyy")}`
              : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateDeadlines.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              data-testid="no-deadlines-message"
            >
              <CalendarIcon className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="font-semibold text-lg mb-1">No deadlines</h3>
              <p className="text-sm text-muted-foreground">
                {selectedDate
                  ? "There are no deadlines scheduled for this date."
                  : "Select a date to view deadlines."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4" data-testid="deadlines-list">
                {selectedDateDeadlines.map((deadline, index) => (
                  <Card
                    key={`${deadline.caseId}-${deadline.date}-${index}`}
                    className="p-4"
                    data-testid={`deadline-${index}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={getPriorityColor(deadline.priority)}
                            data-testid={`badge-priority-${index}`}
                          >
                            {deadline.priority === "high" && (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            )}
                            {deadline.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <h4
                          className="font-semibold text-base mb-1"
                          data-testid={`text-description-${index}`}
                        >
                          {deadline.description}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Case:</span>
                        <span
                          className="font-medium"
                          data-testid={`text-case-name-${index}`}
                        >
                          {deadline.caseName}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          data-testid={`text-case-number-${index}`}
                        >
                          {deadline.caseNumber}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Source:</span>
                        <span
                          className="text-xs font-mono"
                          data-testid={`text-document-${index}`}
                        >
                          {deadline.documentName}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
