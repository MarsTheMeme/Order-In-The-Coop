import { Send, Loader2, Plus, X, FileText, Mic } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChatMessage, type ChatMessageProps } from "./ChatMessage";
import chickenAvatar from "@assets/image_1761371205289.png";

interface AttachedDocument {
  id: string;
  name: string;
}

interface ChatInterfaceProps {
  messages: ChatMessageProps[];
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
  attachedDocuments?: AttachedDocument[];
  onAttachDocument?: () => void;
  onRemoveDocument?: (id: string) => void;
}

export function ChatInterface({ 
  messages, 
  onSendMessage, 
  isProcessing,
  attachedDocuments = [],
  onAttachDocument,
  onRemoveDocument
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6">
        <div className="max-w-4xl mx-auto py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 rounded-md mb-4">
                <img src={chickenAvatar} alt="Tender" className="w-full h-full rounded-md" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Welcome! I'm Tender, your AI legal assistant</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Upload case documents, transcripts, or emails to get started. I'll analyze them and
                extract key information to help you progress your case.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => <ChatMessage key={index} {...message} />)}
              <div ref={messagesEndRef} />
            </>
          )}
          {isProcessing && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Analyzing document...</span>
            </div>
          )}
        </div>
      </div>

      <div className="border-t p-4 flex-shrink-0 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="bg-muted/50 rounded-lg p-3 space-y-3">
            {attachedDocuments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-md px-3 py-2"
                    data-testid={`attached-doc-${doc.id}`}
                  >
                    <FileText className="w-4 h-4 text-primary" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-primary truncate max-w-[200px]">
                        {doc.name}
                      </span>
                      <span className="text-xs text-muted-foreground">Document</span>
                    </div>
                    {onRemoveDocument && (
                      <button
                        onClick={() => onRemoveDocument(doc.id)}
                        className="ml-2 hover-elevate active-elevate-2 rounded-full p-0.5"
                        data-testid={`button-remove-doc-${doc.id}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              {onAttachDocument && (
                <Button
                  onClick={onAttachDocument}
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  disabled={isProcessing}
                  data-testid="button-attach-document"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              )}
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything"
                className="resize-none min-h-[44px] border-0 bg-transparent focus-visible:ring-0 shadow-none"
                disabled={isProcessing}
                data-testid="input-chat"
                rows={1}
              />
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                disabled={isProcessing}
                data-testid="button-voice"
              >
                <Mic className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                size="icon"
                className="flex-shrink-0"
                data-testid="button-send"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
