import { FileText, MessageSquare, CheckSquare, Clock, Settings, Plus } from "lucide-react";
import chickenLogo from "@assets/image_1761371205289.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CaseItem {
  id: string;
  name: string;
  caseNumber: string;
  documentCount: number;
  pendingApprovals: number;
}

interface AppSidebarProps {
  cases: CaseItem[];
  activeCase: string | null;
  onCaseSelect: (caseId: string) => void;
  onNewCase: () => void;
}

export function AppSidebar({ cases, activeCase, onCaseSelect, onNewCase }: AppSidebarProps) {
  const menuItems = [
    {
      title: "Chat",
      icon: MessageSquare,
      id: "chat",
    },
    {
      title: "Documents",
      icon: FileText,
      id: "documents",
    },
    {
      title: "Approvals",
      icon: CheckSquare,
      id: "approvals",
    },
    {
      title: "Deadlines",
      icon: Clock,
      id: "deadlines",
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={chickenLogo} alt="Tender" className="w-9 h-9 rounded-md" />
          <div>
            <h2 className="text-lg font-semibold">Order In The Coop</h2>
            <p className="text-xs text-muted-foreground">with Tender</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton data-testid={`link-${item.id}`}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel>Active Cases</SidebarGroupLabel>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={onNewCase}
              data-testid="button-new-case"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <SidebarGroupContent>
            <ScrollArea className="h-[400px]">
              <SidebarMenu>
                {cases.map((caseItem) => (
                  <SidebarMenuItem key={caseItem.id}>
                    <SidebarMenuButton
                      isActive={activeCase === caseItem.id}
                      onClick={() => onCaseSelect(caseItem.id)}
                      className="flex-col items-start h-auto py-3"
                      data-testid={`case-${caseItem.id}`}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-medium text-sm truncate">{caseItem.name}</span>
                        {caseItem.pendingApprovals > 0 && (
                          <Badge variant="secondary" className="text-xs px-1.5">
                            {caseItem.pendingApprovals}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 w-full text-xs text-muted-foreground mt-1">
                        <span className="font-mono">{caseItem.caseNumber}</span>
                        <span>{caseItem.documentCount} docs</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton data-testid="link-settings">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
