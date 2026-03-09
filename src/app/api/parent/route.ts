import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// GET /api/parent?code=ABC123 — look up student by parent code
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase();
  if (!code || code.length < 4) {
    return NextResponse.json({ error: 'Kode tidak valid' }, { status: 400 });
  }

  const db = getSupabase();

  const { data: student, error } = await db
    .from('students')
    .select('id, name, grade, stars, level, avatar_url')
    .eq('parent_code', code)
    .single();

  if (error || !student) {
    return NextResponse.json({ error: 'Kode tidak ditemukan' }, { status: 404 });
  }

  // Fetch recent progress
  const { data: progress } = await db
    .from('progress')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ student, progress: progress || [] });
}
