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
    const response = await fetch(`https://jules.googleapis.com/v1alpha/sessions/${id}/activities?pageSize=30`, {
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
