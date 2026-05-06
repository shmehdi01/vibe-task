import { NextRequest, NextResponse } from 'next/server';
import { Base64 } from 'js-base64';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const rawDomain = req.headers.get('x-jira-domain');
  const email = req.headers.get('x-jira-email');
  const token = req.headers.get('x-jira-token');

  if (!rawDomain || !email || !token) {
    return NextResponse.json({ error: 'Missing Jira credentials' }, { status: 401 });
  }

  const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const authHeader = `Basic ${Base64.encode(`${email}:${token}`)}`;
  const url = `https://${domain}/rest/api/3/issue/${key}`;

  console.log(`Fetching Jira issue detail from: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Jira API error (${response.status}): ${errorText}`);
      return NextResponse.json({ error: `Jira API error: ${response.statusText}`, detail: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Fetch error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
