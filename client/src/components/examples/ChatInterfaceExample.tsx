import { ChatInterface } from "../ChatInterface";
import { useState } from "react";
import type { ChatMessageProps } from "../ChatMessage";

export default function ChatInterfaceExample() {
  const [messages, setMessages] = useState<ChatMessageProps[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI legal assistant. Upload a document or ask me anything about your case.",
      timestamp: "2:30 PM",
    },
  ]);

  const handleSend = (message: string) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I understand. Let me help you with that.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1000);
  };

  return (
    <div className="h-[600px] border rounded-md">
      <ChatInterface messages={messages} onSendMessage={handleSend} />
    </div>
  );
}
