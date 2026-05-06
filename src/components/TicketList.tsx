'use client';

import { JiraIssue } from '@/lib/prompt-builder';
import { useSettingsStore } from '@/store/settings';
import { AlertCircle, CheckCircle2, Circle, Clock, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function TicketRow({ 
  issue, 
  isSelected, 
  onClick 
}: { 
  issue: JiraIssue; 
  isSelected: boolean; 
  onClick: () => void 
}) {
  const { ticketSessions } = useSettingsStore();

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'highest': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-zinc-500';
    }
  };

  const getStatusInfo = (status: string) => {
    const s = status.toLowerCase();
    
    // Done / Resolved (Green)
    if (s.includes('done') || s.includes('resolved') || s.includes('complete') || s.includes('closed')) {
      return { 
        icon: <CheckCircle2 className="h-3 w-3" />, 
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
      };
    }
    
    // In Progress / Review (Indigo/Blue)
    if (s.includes('progress') || s.includes('review') || s.includes('testing') || s.includes('dev')) {
      return { 
        icon: <Clock className="h-3 w-3" />, 
        color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.1)]' 
      };
    }

    // Blocked / Impediment (Red)
    if (s.includes('block') || s.includes('hold') || s.includes('impediment')) {
      return { 
        icon: <AlertCircle className="h-3 w-3" />, 
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]' 
      };
    }
    
    // To Do / Backlog (Zinc/Grey)
    return { 
      icon: <Circle className="h-3 w-3" />, 
      color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20 shadow-none' 
    };
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col gap-1 border-b border-white/5 p-4 text-left transition-colors hover:bg-white/5",
        isSelected && "bg-indigo-600/10"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold tracking-tight text-zinc-500 group-hover:text-zinc-300">
          {issue.key}
        </span>
        <div className="flex items-center gap-2">
          {ticketSessions[issue.key] && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.2)]" title="Jules has worked on this ticket">
              <Zap className="h-3 w-3 fill-indigo-400" />
            </div>
          )}
          <span className={cn("text-[10px] font-bold uppercase", getPriorityColor(issue.fields.priority.name))}>
            {issue.fields.priority.name}
          </span>
          <div className={cn(
            "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            getStatusInfo(issue.fields.status.name).color
          )}>
            {getStatusInfo(issue.fields.status.name).icon}
            {issue.fields.status.name}
          </div>
        </div>
      </div>
      <h3 className={cn(
        "line-clamp-2 text-sm font-medium transition-colors",
        isSelected ? "text-indigo-400" : "text-zinc-200 group-hover:text-white"
      )}>
        {issue.fields.summary}
      </h3>
      <div className="mt-1 flex flex-wrap gap-1">
        {issue.fields.labels.slice(0, 2).map(label => (
          <span key={label} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
            {label}
          </span>
        ))}
      </div>
    </button>
  );
}

export function TicketList({ 
  issues, 
  selectedKey, 
  onSelect,
  isLoading 
}: { 
  issues: JiraIssue[]; 
  selectedKey: string | null; 
  onSelect: (key: string) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Clock className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-zinc-500">
        <AlertCircle className="mb-2 h-10 w-10 opacity-20" />
        <p className="text-sm">No tickets found.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {issues.map((issue) => (
        <TicketRow
          key={issue.key}
          issue={issue}
          isSelected={selectedKey === issue.key}
          onClick={() => onSelect(issue.key)}
        />
      ))}
    </div>
  );
}
