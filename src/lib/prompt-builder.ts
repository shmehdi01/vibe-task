import { adfToText } from './adf-to-text';

interface ADFNode {
  type?: string;
  text?: string;
  content?: ADFNode[];
}

export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    description: ADFNode;
    issuetype: { name: string };
    priority: { name: string };
    labels: string[];
    status: { name: string };
    assignee: { displayName: string } | null;
    reporter: { displayName: string };
    comment?: {
      comments: Array<{
        body: ADFNode;
        author: { displayName: string };
        created: string;
      }>;
    };
  };
}

export function buildJulesPrompt(issue: JiraIssue, customPreferences?: string): string {
  const { fields, key } = issue;
  const description = adfToText(fields.description);
  
  const lastComments = fields.comment?.comments
    .slice(-3)
    .map(c => `[${c.author.displayName}]: ${adfToText(c.body)}`)
    .join('\n') || 'No recent comments.';

  const prefs = customPreferences ? `\n\n### Custom Instructions & Preferences:\n${customPreferences}` : '';

  return `Fix/Implement ${fields.issuetype.name.toUpperCase()}: ${key} - ${fields.summary}

**Priority:** ${fields.priority.name}
**Labels:** ${fields.labels.join(', ') || 'None'}
**Reporter:** ${fields.reporter.displayName}

---

**Description:**
${description || 'No description provided.'}

---

**Additional Context (recent comments):**
${lastComments}

---

Please implement this change, ensure tests pass, and follow the existing code style.${prefs}`;
}
