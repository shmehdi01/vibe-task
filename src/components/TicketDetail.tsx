'use client';

import { useState, useEffect } from 'react';
import { JiraIssue, buildJulesPrompt } from '@/lib/prompt-builder';
import { useSettingsStore } from '@/store/settings';
import { 
  Send, 
  Code, 
  GitBranch, 
  CheckSquare, 
  AlertTriangle,
  Loader2,
  Search
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function TicketDetail({ 
  issue, 
  onSessionCreated,
  isActive
}: { 
  issue: JiraIssue; 
  onSessionCreated: (sessionId: string) => void;
  isActive?: boolean;
}) {
  const { julesApiKey, customPreferences } = useSettingsStore();
  const [prompt, setPrompt] = useState('');
  const [sources, setSources] = useState<{ id: string; name: string }[]>([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [branch, setBranch] = useState('main');
  const [autoPR, setAutoPR] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [sourceSearchQuery, setSourceSearchQuery] = useState('');

  const [lastIssueKey, setLastIssueKey] = useState<string | null>(null);

  if (issue && issue.key !== lastIssueKey) {
    setLastIssueKey(issue.key);
    setPrompt(buildJulesPrompt(issue, customPreferences));
  }

  useEffect(() => {
    const fetchSources = async () => {
      setIsLoadingSources(true);
      try {
        const res = await fetch('/api/jules/sources', {
          headers: {
            'x-goog-api-key': julesApiKey,
          },
        });
        const data = await res.json();
        console.log('Jules Sources received:', data);
        if (data.sources) {
          setSources(data.sources);
          if (data.sources.length > 0) {
            setSelectedSource(data.sources[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch sources:', err);
      } finally {
        setIsLoadingSources(false);
      }
    };

    if (julesApiKey) fetchSources();
  }, [julesApiKey]);

  const handleSendToJules = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/jules/sessions', {
        method: 'POST',
        headers: {
          'x-goog-api-key': julesApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${issue.key}: ${issue.fields.summary}`,
          prompt: prompt,
          sourceContext: {
            source: selectedSource,
            githubRepoContext: {
              startingBranch: branch,
            },
          },
          automationMode: autoPR ? 'AUTO_CREATE_PR' : undefined,
          requirePlanApproval: requireApproval,
        }),
      });

      const data = await res.json();
      if (data.name) {
        const sessionId = data.name.split('/').pop();
        onSessionCreated(sessionId);
      } else {
        alert('Error creating session: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to create session:', err);
      alert('Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  if (!issue) return null;

  return (
    <div className="flex h-full flex-col p-6 overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
          <span>{issue.fields.issuetype.name}</span>
          <span>·</span>
          <span className="text-zinc-300">{issue.key}</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">{issue.fields.summary}</h1>
        
        <div className="flex gap-4 mb-8">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">Status</span>
            <span className="text-sm font-medium text-zinc-300">{issue.fields.status.name}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">Priority</span>
            <span className="text-sm font-medium text-zinc-300">{issue.fields.priority.name}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">Reporter</span>
            <span className="text-sm font-medium text-zinc-300">{issue.fields.reporter.displayName}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Jules Prompt</label>
          <textarea
            className="w-full h-64 rounded-xl border border-white/10 bg-zinc-900/50 p-4 font-mono text-sm leading-relaxed text-zinc-300 focus:border-indigo-500 focus:outline-none"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Source Repository</label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter repositories..."
                  className="w-full rounded-lg border border-white/10 bg-zinc-900/30 px-9 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  value={sourceSearchQuery}
                  onChange={(e) => setSourceSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <Code className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <select
                  className="w-full appearance-none rounded-lg border border-white/10 bg-zinc-900 px-10 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  disabled={isLoadingSources}
                >
                  {isLoadingSources ? (
                    <option>Loading sources...</option>
                  ) : sources.length > 0 ? (
                    sources
                      .filter(s => s.name.toLowerCase().includes(sourceSearchQuery.toLowerCase()))
                      .map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.displayName || s.name.split('/').pop()}
                        </option>
                      ))
                  ) : (
                    <option>No sources connected</option>
                  )}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Branch</label>
            <div className="relative">
              <GitBranch className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                className="w-full rounded-lg border border-white/10 bg-zinc-900 px-10 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setAutoPR(!autoPR)}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
            >
              <div className={cn(
                "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                autoPR ? "border-indigo-500 bg-indigo-500" : "border-zinc-700 bg-zinc-900"
              )}>
                {autoPR && <CheckSquare className="h-3 w-3 text-white" />}
              </div>
              Auto-create Pull Request
            </button>

            <button
              onClick={() => setRequireApproval(!requireApproval)}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
            >
              <div className={cn(
                "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                requireApproval ? "border-indigo-500 bg-indigo-500" : "border-zinc-700 bg-zinc-900"
              )}>
                {requireApproval && <CheckSquare className="h-3 w-3 text-white" />}
              </div>
              Require Plan Approval
            </button>
          </div>

          <button
            onClick={handleSendToJules}
            disabled={isCreating || !selectedSource || isActive}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:grayscale"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : isActive ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                Working...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send to Jules
              </>
            )}
          </button>
        </div>
      </div>

      {!selectedSource && !isLoadingSources && (
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-200/80">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            No sources connected. Connect a GitHub repository in the{' '}
            <a href="https://jules.google.com" target="_blank" className="font-bold underline underline-offset-4 hover:text-yellow-200">
              Jules dashboard
            </a>{' '}
            first.
          </p>
        </div>
      )}
    </div>
  );
}
