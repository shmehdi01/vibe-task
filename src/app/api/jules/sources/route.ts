import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-goog-api-key');

  if (!key) {
    return NextResponse.json({ error: 'Missing Jules API key' }, { status: 401 });
  }

  try {
    const response = await fetch('https://jules.googleapis.com/v1alpha/sources?pageSize=1000', {
      headers: {
        'X-Goog-Api-Key': key,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();
    console.log(`Jules Sources API: Found ${data.sources?.length || 0} sources`);
    if (data.nextPageToken) {
      console.warn('Jules Sources API: More pages available, nextPageToken:', data.nextPageToken);
    }
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
