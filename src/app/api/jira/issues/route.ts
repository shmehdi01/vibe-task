import { NextRequest, NextResponse } from 'next/server';
import { Base64 } from 'js-base64';

export async function GET(req: NextRequest) {
  const rawDomain = req.headers.get('x-jira-domain');
  const email = req.headers.get('x-jira-email');
  const token = req.headers.get('x-jira-token');
  const searchParams = req.nextUrl.searchParams;
  const jql = searchParams.get('jql') || 'assignee = currentUser() ORDER BY updated DESC';

  if (!rawDomain || !email || !token) {
    return NextResponse.json({ error: 'Missing Jira credentials' }, { status: 401 });
  }

  // Sanitize domain
  const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const authHeader = `Basic ${Base64.encode(`${email}:${token}`)}`;
  
  // Try the new enhanced search path with GET
  const url = `https://${domain}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=summary,status,issuetype,priority,labels,assignee&maxResults=50`;

  console.log(`Jira Search Request: GET ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Jira API error (${response.status}): ${errorText}`);
      
      // If GET fails, try POST as a fallback
      if (response.status === 405 || response.status === 404 || response.status === 410) {
        console.log('GET failed, trying POST fallback...');
        const postUrl = `https://${domain}/rest/api/3/search/jql`;
        const postResponse = await fetch(postUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jql: jql,
            fields: ['summary', 'status', 'issuetype', 'priority', 'labels', 'assignee'],
            maxResults: 50,
          }),
          cache: 'no-store',
        });
        
        if (postResponse.ok) {
          const data = await postResponse.json();
          return NextResponse.json(data);
        } else {
          const postError = await postResponse.text();
          return NextResponse.json({ error: `Jira API error (POST fallback): ${postResponse.statusText}`, detail: postError }, { status: postResponse.status });
        }
      }

      return NextResponse.json({ error: `Jira API error: ${response.statusText}`, detail: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error(`Fetch error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
