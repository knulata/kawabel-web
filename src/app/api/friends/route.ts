import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// GET /api/friends?student_id=X — list friends
export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get('student_id');
    if (!studentId) return NextResponse.json({ friends: [] });

    const db = getSupabase();
    const { data: friendships } = await db
      .from('friendships')
      .select('friend_id')
      .eq('student_id', parseInt(studentId));

    if (!friendships || friendships.length === 0) {
      return NextResponse.json({ friends: [] });
    }

    const friendIds = friendships.map((f: { friend_id: number }) => f.friend_id);

    const { data: students } = await db
      .from('students')
      .select('id, name, avatar_url, level')
      .in('id', friendIds);

    const { data: gamData } = await db
      .from('gamification')
      .select('student_id, xp, streak, last_active_date')
      .in('student_id', friendIds);

    const gamMap = new Map((gamData || []).map((g: Record<string, unknown>) => [g.student_id, g]));

    const friends = (students || []).map((s: Record<string, unknown>) => {
      const gam = gamMap.get(s.id as number) as Record<string, unknown> | undefined;
      return {
        id: s.id,
        name: s.name,
        avatar_url: s.avatar_url,
        level: s.level,
        xp: gam?.xp ?? 0,
        streak: gam?.streak ?? 0,
        lastActive: gam?.last_active_date ?? '',
      };
    });

    return NextResponse.json({ friends });
  } catch (err) {
    console.error('Friends error:', err);
    return NextResponse.json({ friends: [] });
  }
}

// POST /api/friends — add friend by parent_code
export async function POST(req: NextRequest) {
  try {
    const { student_id, friend_code } = await req.json();
    if (!student_id || !friend_code) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const db = getSupabase();

    // Find friend by parent_code
    const { data: friend } = await db
      .from('students')
      .select('id, name')
      .eq('parent_code', friend_code.trim().toUpperCase())
      .single();

    if (!friend) {
      return NextResponse.json({ error: 'Kode tidak ditemukan' }, { status: 404 });
    }

    if (friend.id === student_id) {
      return NextResponse.json({ error: 'Tidak bisa menambahkan dirimu sendiri' }, { status: 400 });
    }

    // Add bidirectional friendship
    await db.from('friendships').upsert([
      { student_id, friend_id: friend.id },
      { student_id: friend.id, friend_id: student_id },
    ], { onConflict: 'student_id,friend_id' });

    return NextResponse.json({ success: true, friend: { id: friend.id, name: friend.name } });
  } catch (err) {
    console.error('Add friend error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE /api/friends — remove friend
export async function DELETE(req: NextRequest) {
  try {
    const { student_id, friend_id } = await req.json();
    if (!student_id || !friend_id) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const db = getSupabase();
    await db.from('friendships').delete().match({ student_id, friend_id });
    await db.from('friendships').delete().match({ student_id: friend_id, friend_id: student_id });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Remove friend error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
