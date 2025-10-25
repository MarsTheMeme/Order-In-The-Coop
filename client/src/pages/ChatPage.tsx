import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChatInterface } from "@/components/ChatInterface";
import { FileUploadZone } from "@/components/FileUploadZone";
import { ExtractedDataCard } from "@/components/ExtractedDataCard";
import { ActionApprovalCard } from "@/components/ActionApprovalCard";
import { ApprovalsTab } from "@/components/ApprovalsTab";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, CheckSquare, Clock, Upload } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatPageProps {
  caseId: number;
  caseName: string;
}

interface AttachedDocument {
  id: string;
  name: string;
}

export default function ChatPage({ caseId, caseName }: ChatPageProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [attachedDocuments, setAttachedDocuments] = useState<AttachedDocument[]>([]);
  const { toast } = useToast();

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessageProps[]>({
    queryKey: ["/api/cases", caseId, "messages"],
  });

  const { data: extractedDataList = [] } = useQuery<
    Array<{
      extracted: {
        id: number;
        caseNumber: string | null;
        parties: string[];
        deadlines: Array<{ date: string; description: string; priority: "high" | "medium" | "low" }>;
        keyFacts: string[];
        confidence: string | null;
      };
    }>
  >({
    queryKey: ["/api/cases", caseId, "extracted-data"],
  });

  const { data: actions = [] } = useQuery<ActionItem[]>({
    queryKey: ["/api/cases", caseId, "actions"],
  });

  const { data: approvals = [], isLoading: approvalsLoading } = useQuery<
    Array<{
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
    }>
  >({
    queryKey: ["/api/approvals"],
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
    onSuccess: (data, file) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "extracted-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "actions"] });
      
      setAttachedDocuments(prev => [...prev, {
        id: data.document?.id?.toString() || Date.now().toString(),
        name: file.name
      }]);
      
      toast({
        title: "Document attached",
        description: "You can now ask questions about this document.",
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
      return apiRequest("PATCH", `/api/actions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "actions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      toast({
        title: "Action approved",
        description: "The action has been moved to the Approvals tab.",
      });
    },
  });

  const deleteActionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/actions/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "actions"] });
      toast({
        title: "Action rejected",
        description: "The suggested action has been removed.",
      });
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

  const handleAttachDocument = () => {
    setShowUploadDialog(true);
  };

  const handleRemoveDocument = (id: string) => {
    setAttachedDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const handleApprove = (id: string) => {
    updateActionMutation.mutate({ id: parseInt(id), status: "approved" });
  };

  const handleReject = (id: string) => {
    deleteActionMutation.mutate(parseInt(id));
  };

  const latestExtractedData = extractedDataList[0]?.extracted;
  const mappedExtractedData = latestExtractedData
    ? {
        caseNumber: latestExtractedData.caseNumber || undefined,
        parties: latestExtractedData.parties,
        deadlines: latestExtractedData.deadlines,
        keyFacts: latestExtractedData.keyFacts,
        confidence: latestExtractedData.confidence ? parseFloat(latestExtractedData.confidence) : undefined,
      }
    : null;

  const mappedActions = actions
    .filter((action) => action.status === "pending")
    .map((action) => ({
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
            <p className="text-sm text-muted-foreground" data-testid="text-case-name">{caseName}</p>
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

      <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b px-4">
          <div className="max-w-4xl mx-auto">
            <TabsList className="bg-transparent h-auto p-0 space-x-6" data-testid="tabs-navigation">
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 gap-2"
                data-testid="tab-chat"
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger 
                value="documents" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 gap-2"
                data-testid="tab-documents"
              >
                <FileText className="w-4 h-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger 
                value="approvals" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 gap-2"
                data-testid="tab-approvals"
              >
                <CheckSquare className="w-4 h-4" />
                Approvals
              </TabsTrigger>
              <TabsTrigger 
                value="deadlines" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 gap-2"
                data-testid="tab-deadlines"
              >
                <Clock className="w-4 h-4" />
                Deadlines
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="chat" className="flex-1 overflow-hidden m-0 mt-0">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isProcessing={sendMessageMutation.isPending || uploadDocumentMutation.isPending}
            attachedDocuments={attachedDocuments}
            onAttachDocument={handleAttachDocument}
            onRemoveDocument={handleRemoveDocument}
          />
        </TabsContent>

        <TabsContent value="documents" className="flex-1 overflow-y-auto m-0" data-testid="tab-content-documents">
          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {mappedExtractedData ? (
                <>
                  <ExtractedDataCard data={mappedExtractedData} />
                  {mappedActions.length > 0 && (
                    <ActionApprovalCard
                      actions={mappedActions}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No documents uploaded yet.</p>
                  <p className="text-sm mt-2">Upload a document to see extracted information.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="flex-1 overflow-y-auto m-0" data-testid="tab-content-approvals">
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <ApprovalsTab approvals={approvals} isLoading={approvalsLoading} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="deadlines" className="flex-1 overflow-y-auto m-0" data-testid="tab-content-deadlines">
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Deadlines</h3>
                <p>Deadline tracking and calendar coming soon.</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
