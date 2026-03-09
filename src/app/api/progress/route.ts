import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// Save progress
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student_id, subject, topic, score, total, type } = body;

    if (!student_id || !subject || score === undefined || !total) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const db = getSupabase();
    const { data, error } = await db
      .from('progress')
      .insert({
        student_id,
        subject,
        topic: topic || '',
        score,
        total,
        type: type || 'homework',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Save progress error:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    // Update student stars
    await db.rpc('increment_stars', { sid: student_id, amount: score });

    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error('Progress error:', err);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
