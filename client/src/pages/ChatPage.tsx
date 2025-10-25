import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { FileUploadZone } from "@/components/FileUploadZone";
import { ExtractedDataCard } from "@/components/ExtractedDataCard";
import { ActionApprovalCard } from "@/components/ActionApprovalCard";
import type { ChatMessageProps } from "@/components/ChatMessage";
import type { ExtractedData } from "@/components/ExtractedDataCard";
import type { ActionItem } from "@/components/ActionApprovalCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);

  const handleSendMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: message,
        timestamp,
      },
    ]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I can help you with that. Would you like to upload a document for analysis?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 800);
  };

  const handleFilesSelected = (files: File[]) => {
    setShowUploadDialog(false);
    setIsProcessing(true);

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `Uploaded: ${files.map((f) => f.name).join(", ")}`,
        timestamp,
      },
    ]);

    setTimeout(() => {
      setIsProcessing(false);
      
      const mockExtracted: ExtractedData = {
        caseNumber: "CV-2024-001234",
        parties: [
          "Plaintiff: Maria Johnson",
          "Defendant: MegaCorp Industries LLC",
        ],
        deadlines: [
          {
            date: "November 15, 2024",
            description: "Motion to Compel Discovery",
            priority: "high",
          },
        ],
        keyFacts: [
          "Plaintiff alleges wrongful termination",
          "Email evidence available from HR department",
        ],
        confidence: 0.92,
      };

      const mockActions: ActionItem[] = [
        {
          id: "1",
          title: "Request Email Records",
          description: "File formal discovery request for email correspondence",
          rationale: "Witness testimony mentions email evidence supporting the claim.",
          priority: "high",
          status: "pending",
        },
      ];

      setExtractedData(mockExtracted);
      setActions(mockActions);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Analysis complete! I've extracted key information from the document. Please review the extracted data below and approve or reject the suggested actions.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isAnalysis: true,
        },
      ]);
    }, 2000);
  };

  const handleApprove = (id: string) => {
    setActions((prev) =>
      prev.map((action) =>
        action.id === id ? { ...action, status: "approved" as const } : action
      )
    );
    
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Action approved! I'll proceed with this task.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleReject = (id: string) => {
    setActions((prev) =>
      prev.map((action) =>
        action.id === id ? { ...action, status: "rejected" as const } : action
      )
    );
    
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Action rejected. I won't proceed with this task.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Case Assistant</h1>
            <p className="text-sm text-muted-foreground">Johnson v. MegaCorp</p>
          </div>
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="gap-2"
            data-testid="button-upload-document"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
        />
      </div>

      {extractedData && (
        <div className="border-t p-4 bg-muted/30">
          <div className="max-w-4xl mx-auto space-y-4">
            <ExtractedDataCard data={extractedData} />
            {actions.length > 0 && (
              <ActionApprovalCard
                actions={actions}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}
          </div>
        </div>
      )}

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Case Documents</DialogTitle>
            <DialogDescription>
              Upload transcripts, emails, or other case documents for AI analysis
            </DialogDescription>
          </DialogHeader>
          <FileUploadZone onFilesSelected={handleFilesSelected} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
