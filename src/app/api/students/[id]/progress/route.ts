import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const studentId = parseInt(id, 10);
  if (isNaN(studentId)) {
    return NextResponse.json({ progress: [] });
  }

  try {
    const db = getSupabase();
    const { data } = await db
      .from('progress')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({ progress: data || [] });
  } catch {
    return NextResponse.json({ progress: [] });
  }
}
