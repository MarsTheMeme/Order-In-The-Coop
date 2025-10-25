import { useState } from "react";
import { Settings, Plus, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";

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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCases = cases.filter((caseItem) =>
    caseItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caseItem.caseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    
    // Escape special regex characters to prevent syntax errors
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, index) => {
          // Check if this part matches the query (case-insensitive)
          const isMatch = part.toLowerCase() === query.toLowerCase();
          return isMatch ? (
            <mark key={index} className="bg-primary/20 text-foreground font-semibold rounded px-0.5">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          );
        })}
      </span>
    );
  };

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
          <div className="px-2 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
                data-testid="input-case-search"
              />
            </div>
          </div>
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
                {filteredCases.map((caseItem) => (
                  <SidebarMenuItem key={caseItem.id}>
                    <SidebarMenuButton
                      isActive={activeCase === caseItem.id}
                      onClick={() => onCaseSelect(caseItem.id)}
                      className="flex-col items-start h-auto py-3"
                      data-testid={`case-${caseItem.id}`}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-medium text-sm truncate">
                          {highlightMatch(caseItem.name, searchQuery)}
                        </span>
                        {caseItem.pendingApprovals > 0 && (
                          <Badge variant="secondary" className="text-xs px-1.5">
                            {caseItem.pendingApprovals}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 w-full text-xs text-muted-foreground mt-1">
                        <span className="font-mono">
                          {highlightMatch(caseItem.caseNumber, searchQuery)}
                        </span>
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
