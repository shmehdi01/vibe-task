import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  jiraDomain: string;
  jiraEmail: string;
  jiraToken: string;
  jiraJql: string;
  julesApiKey: string;
  customPreferences: string;
  ticketSessions: Record<string, string>;
  selectedTicketKey: string | null;
  setJiraDomain: (val: string) => void;
  setJiraEmail: (val: string) => void;
  setJiraToken: (val: string) => void;
  setJiraJql: (val: string) => void;
  setJulesApiKey: (val: string) => void;
  setCustomPreferences: (val: string) => void;
  setTicketSession: (ticketKey: string, sessionId: string) => void;
  setSelectedTicketKey: (key: string | null) => void;
  saveSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      jiraDomain: '',
      jiraEmail: '',
      jiraToken: '',
      jiraJql: 'assignee = currentUser() ORDER BY updated DESC',
      julesApiKey: '',
      customPreferences: '### Coding Standards\n- Follow existing project style\n- Always run "npm run lint" before completing a task\n- Add tests for new logic\n- Use functional patterns where possible\n\n### PR Strategy\n- Create a new branch named after the ticket key\n- Add a concise PR description',
      ticketSessions: {},
      selectedTicketKey: null,
      setJiraDomain: (val) => set({ jiraDomain: val }),
      setJiraEmail: (val) => set({ jiraEmail: val }),
      setJiraToken: (val) => set({ jiraToken: val }),
      setJiraJql: (val) => set({ jiraJql: val }),
      setJulesApiKey: (val) => set({ julesApiKey: val }),
      setCustomPreferences: (val) => set({ customPreferences: val }),
      setTicketSession: (ticketKey, sessionId) => set((state) => ({
        ticketSessions: { ...state.ticketSessions, [ticketKey]: sessionId }
      })),
      setSelectedTicketKey: (key) => set({ selectedTicketKey: key }),
      saveSettings: () => {}, // Handled by persist
    }),
    {
      name: 'julesboard-settings',
    }
  )
);
