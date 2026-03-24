import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { student_id, state } = await req.json();
    if (!student_id || !state) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const db = getSupabase();
    const { error } = await db.from('gamification').upsert({
      student_id,
      xp: state.xp ?? 0,
      streak: state.streak ?? 0,
      last_active_date: state.lastActiveDate ?? '',
      gems: state.gems ?? 0,
      hearts: state.hearts ?? 5,
      hearts_lost_at: state.heartsLostAt,
      chests_available: state.chestsAvailable ?? 0,
      chests_opened: state.chestsOpened ?? 0,
      achievements: state.achievements ?? [],
      friend_ids: state.friendIds ?? [],
      daily_goal_xp: state.dailyGoalXP ?? 50,
      daily_xp: state.dailyXP ?? 0,
      daily_xp_date: state.dailyXPDate ?? '',
      streak_freezes: state.streakFreezes ?? 0,
      combo: state.combo ?? 0,
      max_combo: state.maxCombo ?? 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_id' });

    if (error) {
      console.error('Gamification sync error:', error);
      return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Gamification sync error:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get('student_id');
    if (!studentId) {
      return NextResponse.json({ error: 'Missing student_id' }, { status: 400 });
    }

    const db = getSupabase();
    const { data } = await db
      .from('gamification')
      .select('*')
      .eq('student_id', parseInt(studentId))
      .single();

    if (!data) {
      return NextResponse.json({ state: null });
    }

    // Map DB columns back to client state shape
    return NextResponse.json({
      state: {
        xp: data.xp,
        streak: data.streak,
        lastActiveDate: data.last_active_date,
        gems: data.gems,
        hearts: data.hearts,
        heartsLostAt: data.hearts_lost_at,
        chestsAvailable: data.chests_available,
        chestsOpened: data.chests_opened,
        achievements: data.achievements || [],
        friendIds: data.friend_ids || [],
        dailyGoalXP: data.daily_goal_xp,
        dailyXP: data.daily_xp,
        dailyXPDate: data.daily_xp_date,
        streakFreezes: data.streak_freezes,
        combo: data.combo,
        maxCombo: data.max_combo,
      },
    });
  } catch (err) {
    console.error('Gamification fetch error:', err);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
