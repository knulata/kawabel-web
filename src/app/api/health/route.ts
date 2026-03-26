import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json(
        { status: 'error', supabase: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      supabase: 'connected',
      students: count,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { status: 'error', message },
      { status: 500 }
    );
  }
}
