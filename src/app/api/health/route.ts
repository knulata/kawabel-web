import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabase();

    // Write to keepalive table — ensures Supabase sees real write activity
    // (Supabase counts writes toward anti-inactivity, not just reads).
    const { data, error } = await supabase
      .from('keepalive')
      .upsert(
        {
          id: 1,
          last_ping: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select('last_ping')
      .single();

    if (error) {
      return NextResponse.json(
        { status: 'error', supabase: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: 'ok',
      supabase: 'connected',
      last_ping: data?.last_ping,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { status: 'error', message },
      { status: 500 },
    );
  }
}
