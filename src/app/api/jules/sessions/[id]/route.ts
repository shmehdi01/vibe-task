import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const key = req.headers.get('x-goog-api-key');

  if (!key) {
    return NextResponse.json({ error: 'Missing Jules API key' }, { status: 401 });
  }

  try {
    const response = await fetch(`https://jules.googleapis.com/v1alpha/sessions/${id}`, {
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const key = req.headers.get('x-goog-api-key');
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get('action'); // sendMessage or approvePlan

  if (!key) {
    return NextResponse.json({ error: 'Missing Jules API key' }, { status: 401 });
  }

  const endpoint = action === 'sendMessage' 
    ? `https://jules.googleapis.com/v1alpha/sessions/${id}:sendMessage`
    : `https://jules.googleapis.com/v1alpha/sessions/${id}:approvePlan`;

  try {
    const body = action === 'sendMessage' ? await req.json() : undefined;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-Goog-Api-Key': key,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
