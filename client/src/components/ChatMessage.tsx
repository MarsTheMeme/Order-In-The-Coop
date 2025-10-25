import { Bot, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isAnalysis?: boolean;
}

export function ChatMessage({ role, content, timestamp, isAnalysis }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
          <Bot className="w-5 h-5" />
        </div>
      )}
      
      <div className={`flex-1 max-w-3xl ${isUser ? "flex justify-end" : ""}`}>
        {isAnalysis ? (
          <Card className="w-full" data-testid="card-ai-analysis">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    AI Analysis
                  </Badge>
                  {timestamp && (
                    <span className="text-xs text-muted-foreground">{timestamp}</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">{content}</CardContent>
          </Card>
        ) : (
          <div
            className={`px-4 py-3 rounded-md ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
            data-testid={`message-${role}`}
          >
            <div className="text-sm whitespace-pre-wrap">{content}</div>
            {timestamp && !isAnalysis && (
              <div className={`text-xs mt-1 ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {timestamp}
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-md bg-muted flex items-center justify-center">
          <User className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
