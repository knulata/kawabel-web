import { NextRequest, NextResponse } from 'next/server';

// Get progress for a student - returns empty until DB is set up
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await params; // consume params
  return NextResponse.json({ progress: [] });
}
