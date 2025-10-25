import { AppSidebar } from "../app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  const mockCases = [
    {
      id: "1",
      name: "Johnson v. MegaCorp",
      caseNumber: "CV-2024-001234",
      documentCount: 24,
      pendingApprovals: 3,
    },
    {
      id: "2",
      name: "Smith Medical Malpractice",
      caseNumber: "CV-2024-005678",
      documentCount: 18,
      pendingApprovals: 0,
    },
    {
      id: "3",
      name: "Rodriguez Employment Dispute",
      caseNumber: "CV-2024-009012",
      documentCount: 12,
      pendingApprovals: 1,
    },
  ];

  return (
    <SidebarProvider>
      <AppSidebar
        cases={mockCases}
        activeCase="1"
        onCaseSelect={(id) => console.log("Case selected:", id)}
        onNewCase={() => console.log("New case clicked")}
      />
    </SidebarProvider>
  );
}
