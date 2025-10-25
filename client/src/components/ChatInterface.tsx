import { Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage, type ChatMessageProps } from "./ChatMessage";
import chickenAvatar from "@assets/image_1761371205289.png";

interface ChatInterfaceProps {
  messages: ChatMessageProps[];
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
}

export function ChatInterface({ messages, onSendMessage, isProcessing }: ChatInterfaceProps) {
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

      <div className="border-t p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or describe what you need help with..."
              className="resize-none min-h-[60px]"
              disabled={isProcessing}
              data-testid="input-chat"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              size="icon"
              className="h-[60px] w-[60px] flex-shrink-0"
              data-testid="button-send"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
