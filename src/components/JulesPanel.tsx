'use client';

import { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '@/store/settings';
import { 
  Terminal, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  MessageSquare,
  Send,
  GitPullRequest,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Activity {
  name: string;
  createTime: string;
  updateTime: string;
  type: string;
  description?: string;
  state: string;
  progressUpdated?: {
    bashOutput?: {
      output: string;
    };
    fileChanges?: {
      files: Array<{ path: string; status: string }>;
    };
  };
  planGenerated?: {
    planSteps: Array<{ description: string }>;
  };
  sessionCompleted?: {
    success: boolean;
  };
}

interface Session {
  state: string;
  outputs?: Array<{
    pullRequest?: {
      url: string;
    };
  }>;
}

export function ActivityFeed({ sessionId }: { sessionId: string }) {
  const { julesApiKey } = useSettingsStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [showRaw, setShowRaw] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const [sessionRes, activitiesRes] = await Promise.all([
          fetch(`/api/jules/sessions/${sessionId}`, { headers: { 'x-goog-api-key': julesApiKey } }),
          fetch(`/api/jules/sessions/${sessionId}/activities`, { headers: { 'x-goog-api-key': julesApiKey } })
        ]);

        const sessionData = await sessionRes.json();
        const activitiesData = await activitiesRes.json();

        setSession(sessionData);
        if (activitiesData.activities) {
          setActivities(activitiesData.activities.reverse());
        }

        // Stop polling if session is in a terminal state
        const terminalStates = ['COMPLETED', 'FAILED', 'CANCELLED'];
        if (terminalStates.includes(sessionData.state)) {
          setIsPolling(false);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    if (isPolling) {
      fetchStatus();
      pollInterval = setInterval(fetchStatus, 5000);
    }

    return () => clearInterval(pollInterval);
  }, [sessionId, julesApiKey, isPolling]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activities]);

  const getPRUrl = () => {
    return session?.outputs?.find((o) => o.pullRequest)?.pullRequest?.url;
  };

  const handleApprovePlan = async () => {
    setIsSending(true);
    try {
      const res = await fetch(`/api/jules/sessions/${sessionId}/approvePlan`, {
        method: 'POST',
        headers: {
          'x-goog-api-key': julesApiKey,
        },
      });
      
      if (res.ok) {
        setIsPolling(true);
      } else {
        const data = await res.json();
        alert('Failed to approve plan: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to approve plan:', err);
      alert('Error approving plan');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!followUp.trim() || isSending) return;
    
    setIsSending(true);
    try {
      const res = await fetch(`/api/jules/sessions/${sessionId}/sendMessage`, {
        method: 'POST',
        headers: {
          'x-goog-api-key': julesApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: followUp }),
      });
      
      if (res.ok) {
        setFollowUp('');
        setIsPolling(true); // Resume polling if it was stopped
      } else {
        const data = await res.json();
        alert('Failed to send message: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Error sending message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950 border-t border-white/5">
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-bold font-mono text-zinc-400">SESSION: {sessionId}</span>
        </div>
        <div className="flex items-center gap-3">
          {getPRUrl() && (
            <a
              href={getPRUrl()}
              target="_blank"
              className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400 hover:underline"
            >
              <GitPullRequest className="h-3 w-3" />
              View Pull Request
            </a>
          )}
          <a
            href={`https://jules.google.com/session/${sessionId}`}
            target="_blank"
            className="flex items-center gap-1 text-[10px] font-bold uppercase text-indigo-400 hover:underline"
          >
            Open in Jules <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Execution Summary (Only if files changed or PR exists) */}
      {(getPRUrl() || activities.some(a => a.progressUpdated?.fileChanges)) && (
        <div className="bg-zinc-900/30 border-b border-white/5 px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status: </span>
            <span className={cn(
              "text-[10px] font-bold uppercase",
              session?.state === 'COMPLETED' ? "text-emerald-400" : "text-indigo-400"
            )}>
              {session?.state}
            </span>
          </div>
          {activities.reduce((acc, curr) => {
            if (curr.progressUpdated?.fileChanges) {
              Object.keys(curr.progressUpdated.fileChanges).forEach(f => acc.add(f));
            }
            return acc;
          }, new Set<string>()).size > 0 && (
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Files Changed:</span>
              <span className="text-[10px] font-bold text-zinc-300">
                {activities.reduce((acc, curr) => {
                  if (curr.progressUpdated?.fileChanges) {
                    Object.keys(curr.progressUpdated.fileChanges).forEach(f => acc.add(f));
                  }
                  return acc;
                }, new Set<string>()).size}
              </span>
            </div>
          )}
          {session?.state === 'WAITING_FOR_INPUT' && (
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <button
                onClick={handleApprovePlan}
                disabled={isSending}
                className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50"
              >
                {isSending ? 'Approving...' : 'Approve Plan ✅'}
              </button>
            </div>
          )}
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-sm scroll-smooth">
        {activities.map((activity, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="flex flex-col items-center pt-1">
              {activity.type === 'SESSION_COMPLETED' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
              {idx !== activities.length - 1 && <div className="mt-2 w-[1px] flex-1 bg-zinc-800" />}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{(activity.type || 'ACTIVITY').replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-700 font-mono">
                    {new Date(activity.createTime).toLocaleTimeString([], { hour12: false })}
                  </span>
                  <button 
                    onClick={() => setShowRaw(showRaw === activity.name ? null : activity.name)}
                    className="text-[9px] text-zinc-800 hover:text-zinc-500 font-bold uppercase tracking-tighter"
                  >
                    {showRaw === activity.name ? 'Hide' : 'Raw'}
                  </button>
                </div>
              </div>

              {showRaw === activity.name && (
                <pre className="mb-4 max-h-40 overflow-y-auto rounded-lg bg-zinc-900 p-2 text-[9px] text-zinc-500 border border-white/5">
                  {JSON.stringify(activity, null, 2)}
                </pre>
              )}

              {/* Main Description Text */}
              {activity.description && (
                <div className="text-[13px] leading-relaxed text-zinc-200 mb-3 max-w-2xl">
                  {activity.description}
                </div>
              )}

              {activity.planGenerated && (
                <div className="mt-2 mb-4 overflow-hidden rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-xs">
                  <div className="bg-indigo-500/10 px-4 py-2.5 border-b border-indigo-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-indigo-300 uppercase tracking-widest text-[10px]">Execution Plan</p>
                      {activity.state === 'COMPLETED' && (
                        <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold text-indigo-400">
                          {session?.requirePlanApproval === false ? 'Plan Auto-Approved' : 'Plan Generated'}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-indigo-400 font-mono">{(activity.planGenerated.planSteps?.length || 0)} STEPS</span>
                  </div>
                  <div className="p-4 space-y-3 text-zinc-400">
                    {activity.planGenerated.planSteps?.map((step, sidx) => (
                      <div key={sidx} className="flex gap-3 group">
                        <span className="flex-shrink-0 w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                          {sidx + 1}
                        </span>
                        <span className="leading-relaxed py-0.5">{step.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activity.progressUpdated?.fileChanges && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] text-zinc-300 mb-3">
                  <span className="text-zinc-500">Updated</span>
                  {Object.keys(activity.progressUpdated.fileChanges).map((file, fidx, arr) => (
                    <span key={fidx} className="flex items-center gap-2">
                      <code className="rounded bg-zinc-800/80 px-2 py-0.5 font-mono text-[11px] text-zinc-300 border border-white/5">
                        {file}
                      </code>
                      {fidx < arr.length - 2 && <span className="text-zinc-500">,</span>}
                      {fidx === arr.length - 2 && <span className="text-zinc-500">and</span>}
                    </span>
                  ))}
                </div>
              )}

              {activity.progressUpdated?.bashOutput && (
                <div className="mt-3 rounded-xl bg-black border border-white/5 overflow-hidden shadow-2xl">
                  <div className="bg-zinc-900/50 px-4 py-2 border-b border-white/5 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-rose-500/30" />
                      <div className="w-2 h-2 rounded-full bg-amber-500/30" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500/30" />
                    </div>
                    <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Terminal</span>
                  </div>
                  <pre className="max-h-60 overflow-y-auto p-4 text-[11px] text-emerald-400/80 font-mono leading-relaxed selection:bg-emerald-500/30">
                    {activity.progressUpdated.bashOutput.output}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
        {session?.state === 'FAILED' && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-200/80">
            <div className="flex items-center gap-2 mb-2 font-bold text-rose-400">
              <AlertCircle className="h-4 w-4" />
              <span>Session Failed</span>
            </div>
            <p className="text-xs font-mono whitespace-pre-wrap leading-relaxed">
              {session?.error?.message || 'Jules encountered an error during execution.'}
            </p>
          </div>
        )}
        {isPolling && (
          <div className="flex items-center gap-2 text-zinc-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Agent is working...</span>
          </div>
        )}
      </div>

      <div className="border-t border-white/5 p-4 bg-zinc-900/50">
        <div className="relative">
          <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Send a follow-up message to the agent..."
            className="w-full rounded-lg border border-white/10 bg-zinc-950 px-10 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            disabled={isSending}
            onKeyDown={(e) => {
               if (e.key === 'Enter') {
                 handleSendMessage();
               }
            }}
          />
          <button 
            onClick={handleSendMessage}
            disabled={isSending || !followUp.trim()}
            className="absolute right-2 top-1.5 rounded-md p-1 hover:bg-white/5 disabled:opacity-30"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            ) : (
              <Send className="h-4 w-4 text-indigo-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
