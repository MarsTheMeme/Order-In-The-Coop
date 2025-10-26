import { Switch, Route } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import ChatPage from "@/pages/ChatPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/not-found";
import { NewCaseDialog } from "@/components/NewCaseDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

function Router({ 
  activeCaseId, 
  caseName,
  hasNoCases
}: { 
  activeCaseId: string | null;
  caseName: string;
  hasNoCases: boolean;
}) {
  if (hasNoCases) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <div className="text-6xl">📋</div>
        <h2 className="text-2xl font-semibold">No Cases Yet</h2>
        <p className="text-muted-foreground max-w-md">
          Click the "+" button in the sidebar to create your first case and start organizing your legal work.
        </p>
      </div>
    );
  }

  if (!activeCaseId) {
    return <NotFound />;
  }

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
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const { toast } = useToast();

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
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (isAuthenticated && activeCase === null && cases.length > 0) {
      setActiveCase(cases[0].id);
    }
  }, [isAuthenticated, activeCase, cases]);

  const createCaseMutation = useMutation({
    mutationFn: async (caseName: string) => {
      const caseNumber = `CASE-${Date.now()}`;
      const response = await apiRequest("POST", "/api/cases", {
        name: caseName,
        caseNumber,
        status: "active",
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      setShowNewCaseDialog(false);
      setActiveCase(data.id.toString());
      toast({
        title: "Case created",
        description: `${data.name} has been created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create case",
        variant: "destructive",
      });
    },
  });

  const deleteCaseMutation = useMutation({
    mutationFn: async (caseId: string) => {
      await apiRequest("DELETE", `/api/cases/${caseId}`, undefined);
      return caseId;
    },
    onSuccess: (_, deletedCaseId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      if (activeCase === deletedCaseId) {
        const remainingCases = cases.filter(c => c.id !== deletedCaseId);
        setActiveCase(remainingCases.length > 0 ? remainingCases[0].id : null);
      }
      toast({
        title: "Case deleted",
        description: "The case has been permanently deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete case",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const currentCase = cases.find(c => c.id === activeCase);
  const caseName = currentCase?.name || "Loading...";
  const hasNoCases = cases.length === 0;

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
            onNewCase={() => setShowNewCaseDialog(true)}
            onDeleteCase={(caseId) => deleteCaseMutation.mutate(caseId)}
          />
          <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between p-3 border-b">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-hidden">
              <Router activeCaseId={activeCase} caseName={caseName} hasNoCases={hasNoCases} />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <NewCaseDialog
        open={showNewCaseDialog}
        onOpenChange={setShowNewCaseDialog}
        onCreateCase={(name) => createCaseMutation.mutate(name)}
        isCreating={createCaseMutation.isPending}
      />
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
