import { ActionApprovalCard, type ActionItem } from "../ActionApprovalCard";
import { useState } from "react";

export default function ActionApprovalCardExample() {
  const [actions, setActions] = useState<ActionItem[]>([
    {
      id: "1",
      title: "Request Email Records",
      description: "File formal discovery request for email correspondence between March 10-20, 2024",
      rationale: "Witness testimony mentions email evidence that corroborates safety complaints. These records are critical to establishing timeline and prior knowledge.",
      priority: "high",
      status: "pending",
    },
    {
      id: "2",
      title: "Schedule Deposition - John Davidson",
      description: "Coordinate deposition with opposing counsel for supervisor John Davidson",
      rationale: "Named as key party in witness statement. His testimony is essential to establish management's response to complaints.",
      priority: "high",
      status: "pending",
    },
    {
      id: "3",
      title: "Review Company Safety Manual",
      description: "Obtain and analyze complete company safety policy documentation from 2023-2024",
      rationale: "Transcript indicates policy violations. Need to compare stated policies with actual practices for potential negligence claim.",
      priority: "medium",
      status: "pending",
    },
  ]);

  const handleApprove = (id: string) => {
    setActions((prev) =>
      prev.map((action) =>
        action.id === id ? { ...action, status: "approved" as const } : action
      )
    );
    console.log("Approved action:", id);
  };

  const handleReject = (id: string) => {
    setActions((prev) =>
      prev.map((action) =>
        action.id === id ? { ...action, status: "rejected" as const } : action
      )
    );
    console.log("Rejected action:", id);
  };

  return (
    <div className="p-6 max-w-3xl">
      <ActionApprovalCard
        actions={actions}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
