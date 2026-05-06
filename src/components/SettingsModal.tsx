'use client';

import { useState } from 'react';
import { useSettingsStore } from '@/store/settings';
import { X, Code } from 'lucide-react';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { 
    jiraDomain, setJiraDomain,
    jiraEmail, setJiraEmail,
    jiraToken, setJiraToken,
    jiraJql, setJiraJql,
    julesApiKey, setJulesApiKey,
    customPreferences, setCustomPreferences,
  } = useSettingsStore();

  const [testingJira, setTestingJira] = useState(false);
  const [testingJules, setTestingJules] = useState(false);

  const testJira = async () => {
    setTestingJira(true);
    try {
      const res = await fetch('/api/jira/myself', {
        headers: {
          'x-jira-domain': jiraDomain,
          'x-jira-email': jiraEmail,
          'x-jira-token': jiraToken,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully connected to Jira as ${data.displayName}`);
      }
    } catch (err: unknown) {
      alert(`Jira Connection Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTestingJira(false);
    }
  };

  const testJules = async () => {
    setTestingJules(true);
    try {
      const res = await fetch('/api/jules/sources', {
        headers: {
          'x-goog-api-key': julesApiKey,
        },
      });
      if (res.ok) {
        alert('Successfully connected to Jules AI');
      }
    } catch (err: unknown) {
      alert(`Jules Connection Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTestingJules(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
          {/* Jira Settings */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <Code className="h-4 w-4" /> Jira Cloud
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Domain (e.g. company.atlassian.net)"
                className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={jiraDomain}
                onChange={(e) => setJiraDomain(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={jiraEmail}
                onChange={(e) => setJiraEmail(e.target.value)}
              />
              <div className="relative">
                <input
                  type="password"
                  placeholder="API Token"
                  className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={jiraToken}
                  onChange={(e) => setJiraToken(e.target.value)}
                />
                <a 
                  href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                  target="_blank" 
                  className="absolute right-3 top-2.5 text-[10px] text-indigo-400 hover:underline"
                >
                  Get Token
                </a>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-600">JQL Query</label>
                <input
                  type="text"
                  placeholder="assignee = currentUser() ORDER BY updated DESC"
                  className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={jiraJql}
                  onChange={(e) => setJiraJql(e.target.value)}
                />
              </div>
              <button 
                onClick={testJira}
                disabled={testingJira || !jiraDomain || !jiraEmail || !jiraToken}
                className="w-full rounded-lg border border-indigo-500/30 py-2 text-xs font-bold text-indigo-400 transition-colors hover:bg-indigo-500/10 disabled:opacity-50"
              >
                {testingJira ? 'Testing...' : 'Test Jira Connection'}
              </button>
            </div>
          </div>

          {/* Jules Settings */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <Code className="h-4 w-4" /> Jules AI
            </h3>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Google API Key"
                  className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={julesApiKey}
                  onChange={(e) => setJulesApiKey(e.target.value)}
                />
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  className="absolute right-3 top-2.5 text-[10px] text-indigo-400 hover:underline"
                >
                  Get Key
                </a>
              </div>
              <button 
                onClick={testJules}
                disabled={testingJules || !julesApiKey}
                className="w-full rounded-lg border border-indigo-500/30 py-2 text-xs font-bold text-indigo-400 transition-colors hover:bg-indigo-500/10 disabled:opacity-50"
              >
                {testingJules ? 'Testing...' : 'Test Jules Connection'}
              </button>
            </div>
          </div>

          {/* AI Preferences */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              Custom AI Preferences
            </h3>
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-600 leading-relaxed mb-2">
                These instructions will be appended to every prompt sent to Jules. Use this for branch strategies, coding standards, or specific fix notes.
              </p>
              <textarea
                placeholder="e.g. Follow SOLID principles, create branch feature/ticket-id, etc."
                className="w-full h-32 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                value={customPreferences}
                onChange={(e) => setCustomPreferences(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-500 active:scale-95"
        >
          Close
        </button>
      </div>
    </div>
  );
}
