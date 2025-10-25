import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import ChatPage from "@/pages/ChatPage";
import NotFound from "@/pages/not-found";
import { useState } from "react";

function Router({ 
  activeCaseId, 
  caseName 
}: { 
  activeCaseId: string;
  caseName: string;
}) {
  return (
    <Switch>
      <Route path="/">
        {() => <ChatPage caseId={parseInt(activeCaseId)} caseName={caseName} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [activeCase, setActiveCase] = useState<string | null>("1");

  const { data: cases = [] } = useQuery<
    Array<{
      id: string;
      name: string;
      caseNumber: string;
      documentCount: number;
      pendingApprovals: number;
    }>
  >({
    queryKey: ["/api/cases"],
  });

  const currentCase = cases.find(c => c.id === activeCase);
  const caseName = currentCase?.name || "Loading...";

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <TooltipProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar
            cases={cases}
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
              <Router activeCaseId={activeCase || "1"} caseName={caseName} />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
