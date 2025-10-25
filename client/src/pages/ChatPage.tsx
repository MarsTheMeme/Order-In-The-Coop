import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatPageProps {
  caseId: number;
}

export default function ChatPage({ caseId }: ChatPageProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessageProps[]>({
    queryKey: ["/api/cases", caseId, "messages"],
  });

  const { data: extractedDataList = [] } = useQuery<
    Array<{
      extracted: ExtractedData & {
        parties: string[];
        deadlines: Array<{ date: string; description: string; priority: "high" | "medium" | "low" }>;
        keyFacts: string[];
      };
    }>
  >({
    queryKey: ["/api/cases", caseId, "extracted-data"],
  });

  const { data: actions = [] } = useQuery<ActionItem[]>({
    queryKey: ["/api/cases", caseId, "actions"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/cases/${caseId}/messages`, "POST", {
        role: "user",
        content,
        isAnalysis: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "messages"] });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/cases/${caseId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "extracted-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "actions"] });
      toast({
        title: "Document analyzed",
        description: "Tender has finished analyzing your document.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateActionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/actions/${id}`, "PATCH", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "actions"] });
    },
  });

  const handleSendMessage = (message: string) => {
    sendMessageMutation.mutate(message);
  };

  const handleFilesSelected = (files: File[]) => {
    setShowUploadDialog(false);
    files.forEach((file) => {
      uploadDocumentMutation.mutate(file);
    });
  };

  const handleApprove = (id: string) => {
    updateActionMutation.mutate({ id: parseInt(id), status: "approved" });
  };

  const handleReject = (id: string) => {
    updateActionMutation.mutate({ id: parseInt(id), status: "rejected" });
  };

  const latestExtractedData = extractedDataList[0]?.extracted;
  const mappedExtractedData = latestExtractedData
    ? {
        caseNumber: latestExtractedData.caseNumber || undefined,
        parties: latestExtractedData.parties,
        deadlines: latestExtractedData.deadlines,
        keyFacts: latestExtractedData.keyFacts,
        confidence: parseFloat(latestExtractedData.confidence || "0"),
      }
    : null;

  const mappedActions = actions.map((action) => ({
    id: action.id.toString(),
    title: action.title,
    description: action.description,
    rationale: action.rationale,
    priority: action.priority as "high" | "medium" | "low",
    status: action.status as "pending" | "approved" | "rejected",
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Tender - Your Legal Assistant</h1>
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
          isProcessing={sendMessageMutation.isPending || uploadDocumentMutation.isPending}
        />
      </div>

      {mappedExtractedData && (
        <div 
          className="border-t bg-muted/30 max-h-[400px] overflow-y-auto flex-shrink-0"
          data-testid="extracted-data-panel"
          style={{ maxHeight: '400px', overflowY: 'auto' }}
        >
          <div className="p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              <ExtractedDataCard data={mappedExtractedData} />
              {mappedActions.length > 0 && (
                <ActionApprovalCard
                  actions={mappedActions}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Case Documents</DialogTitle>
            <DialogDescription>
              Upload transcripts, emails, or other case documents for AI analysis by Tender
            </DialogDescription>
          </DialogHeader>
          <FileUploadZone onFilesSelected={handleFilesSelected} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
