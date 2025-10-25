import { ChatMessage } from "../ChatMessage";

export default function ChatMessageExample() {
  return (
    <div className="flex flex-col gap-4 p-6 max-w-5xl">
      <ChatMessage
        role="user"
        content="Please analyze this phone transcript from our witness interview."
        timestamp="2:34 PM"
      />
      <ChatMessage
        role="assistant"
        content="I'll analyze the transcript for you. Please upload the document and I'll extract key information including dates, parties involved, and critical testimony."
        timestamp="2:34 PM"
      />
      <ChatMessage
        role="assistant"
        isAnalysis
        content="Analysis Complete:

Key Parties Identified:
- Witness: Sarah Martinez (Employee #4521)
- Interviewer: Attorney Mark Johnson
- Mentioned: John Davidson (Supervisor)

Critical Dates:
- Incident Date: March 15, 2024
- First Report: March 18, 2024
- Interview Date: October 20, 2024

Key Facts:
- Witness observed safety protocol violations
- Multiple prior complaints documented
- Corroborating evidence available from email records

Recommended Next Steps:
1. Request email records from March 10-20, 2024
2. Schedule deposition with John Davidson
3. File motion to compel production of safety logs"
        timestamp="2:35 PM"
      />
    </div>
  );
}
