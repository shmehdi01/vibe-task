import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-goog-api-key');
  const body = await req.json();

  if (!key) {
    return NextResponse.json({ error: 'Missing Jules API key' }, { status: 401 });
  }

  try {
    const response = await fetch('https://jules.googleapis.com/v1alpha/sessions', {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': key,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-goog-api-key');

  if (!key) {
    return NextResponse.json({ error: 'Missing Jules API key' }, { status: 401 });
  }

  try {
    const response = await fetch('https://jules.googleapis.com/v1alpha/sessions?pageSize=20', {
      headers: {
        'X-Goog-Api-Key': key,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
