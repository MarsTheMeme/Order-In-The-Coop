import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import ChatPage from "@/pages/ChatPage";
import NotFound from "@/pages/not-found";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ChatPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const [activeCase, setActiveCase] = useState<string | null>("1");
  
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
      name: "Rodriguez Employment",
      caseNumber: "CV-2024-009012",
      documentCount: 12,
      pendingApprovals: 1,
    },
  ];

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar
              cases={mockCases}
              activeCase={activeCase}
              onCaseSelect={setActiveCase}
              onNewCase={() => console.log("New case")}
            />
            <div className="flex flex-col flex-1">
              <header className="flex items-center justify-between p-3 border-b">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-hidden">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
