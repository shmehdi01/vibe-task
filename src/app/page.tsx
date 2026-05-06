'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settings';
import { SettingsModal } from '@/components/SettingsModal';
import { TicketList } from '@/components/TicketList';
import { TicketDetail } from '@/components/TicketDetail';
import { ActivityFeed } from '@/components/JulesPanel';
import { JiraIssue } from '@/lib/prompt-builder';
import { 
  Settings as SettingsIcon, 
  LayoutDashboard, 
  Search, 
  Filter,
  PlusCircle,
  Menu,
  ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const { 
    jiraDomain, jiraEmail, jiraToken, jiraJql, 
    julesApiKey, ticketSessions, setTicketSession,
    selectedTicketKey, setSelectedTicketKey
  } = useSettingsStore();
  
  const isConfigured = jiraDomain && jiraEmail && jiraToken && julesApiKey;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showOnlyJules, setShowOnlyJules] = useState(false);

  const fetchIssues = async () => {
    if (!jiraDomain || !jiraEmail || !jiraToken) return;
    setIsLoading(true);
    try {
      const url = new URL('/api/jira/issues', window.location.origin);
      if (jiraJql) {
        url.searchParams.set('jql', jiraJql);
      }
      
      const res = await fetch(url.toString(), {
        headers: {
          'x-jira-domain': jiraDomain,
          'x-jira-email': jiraEmail,
          'x-jira-token': jiraToken,
        },
      });
      const data = await res.json();
      if (data.issues) {
        setIssues(data.issues);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch issues:', err);
      alert(`Connection Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIssueDetail = async (key: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/jira/issue/${key}`, {
        headers: {
          'x-jira-domain': jiraDomain,
          'x-jira-email': jiraEmail,
          'x-jira-token': jiraToken,
        },
      });
      const data = await res.json();
      setSelectedIssue(data);
      setSelectedTicketKey(key);
      // Restore session for this ticket if it exists
      const existingSession = ticketSessions[key];
      setActiveSessionId(existingSession || null);
    } catch (err) {
      console.error('Failed to fetch issue detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConfigured) {
      fetchIssues();
      if (selectedTicketKey) {
        fetchIssueDetail(selectedTicketKey);
      }
    } else {
      setIsSettingsOpen(true);
    }
  }, [jiraDomain, jiraEmail, jiraToken, jiraJql, isConfigured]);

  return (
    <main className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar - Ticket List */}
      <div className="flex w-80 flex-col border-r border-white/5 bg-zinc-900/30">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-indigo-500" />
            <h1 className="text-lg font-black tracking-tighter uppercase italic">VibeTask</h1>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={fetchIssues}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
              title="Refresh tickets"
            >
              <PlusCircle className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
              title="Settings"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search tickets..."
              className="w-full rounded-lg border border-white/5 bg-zinc-950 px-10 py-2 text-sm text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="mt-3 flex items-center justify-between px-1">
            <button 
              onClick={() => setShowOnlyJules(!showOnlyJules)}
              className={cn(
                "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
                showOnlyJules ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Filter className="h-3 w-3" />
              {showOnlyJules ? "Jules History Only" : "All Tasks"}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2 px-1 overflow-x-auto pb-1 no-scrollbar">
            <button 
              onClick={() => setSelectedStatus(null)}
              className={cn(
                "whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-all border",
                selectedStatus === null 
                  ? "bg-indigo-500 border-indigo-400 text-white" 
                  : "bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/20"
              )}
            >
              All
            </button>
            {Array.from(new Set(issues.map(i => i.fields.status.name))).map(status => (
              <button 
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  "whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-all border",
                  selectedStatus === status 
                    ? "bg-indigo-500 border-indigo-400 text-white" 
                    : "bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/20"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <TicketList
            issues={issues.filter(i => {
              const matchesSearch = i.fields.summary.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                   i.key.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesStatus = !selectedStatus || i.fields.status.name === selectedStatus;
              const matchesJules = !showOnlyJules || !!ticketSessions[i.key];
              return matchesSearch && matchesStatus && matchesJules;
            })}
            selectedKey={selectedIssue?.key || null}
            onSelect={fetchIssueDetail}
            isLoading={isLoading && issues.length === 0}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-zinc-950">
        {selectedIssue ? (
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-hidden">
              <TicketDetail 
                issue={selectedIssue} 
                isActive={!!activeSessionId}
                onSessionCreated={(id) => {
                  setTicketSession(selectedIssue.key, id);
                  setActiveSessionId(id);
                }} 
              />
            </div>
            
            {activeSessionId && (
              <div className="h-1/2 border-t border-white/10 shadow-2xl">
                <ActivityFeed sessionId={activeSessionId} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 scale-150 blur-3xl opacity-20 bg-indigo-500 rounded-full" />
              <LayoutDashboard className="relative h-20 w-20 text-zinc-800" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Select a ticket to begin</h2>
            <p className="max-w-xs text-zinc-500 text-sm leading-relaxed">
              Choose a Jira ticket from the sidebar to compose a prompt and delegate the task to Jules.
            </p>
          </div>
        )}
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </main>
  );
}
