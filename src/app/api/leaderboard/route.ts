import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const period = req.nextUrl.searchParams.get('period') || 'all';
    const friendsOf = req.nextUrl.searchParams.get('friends_of');
    const db = getSupabase();

    let query = db
      .from('gamification')
      .select('student_id, xp, streak, students!inner(id, name, avatar_url, level)')
      .order('xp', { ascending: false })
      .limit(50);

    // Period filtering based on daily_xp_date
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte('daily_xp_date', weekAgo.toISOString().slice(0, 10));
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query = query.gte('daily_xp_date', monthAgo.toISOString().slice(0, 10));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Leaderboard error:', error);
      return NextResponse.json({ leaderboard: [] });
    }

    // Filter by friends if requested
    let entries = (data || []).map((row: Record<string, unknown>) => {
      const student = row.students as Record<string, unknown>;
      return {
        id: student.id as number,
        name: student.name as string,
        avatar_url: student.avatar_url as string | undefined,
        level: student.level as number,
        stars: row.xp as number, // Use XP as the ranking metric
        xp: row.xp as number,
        streak: row.streak as number,
      };
    });

    if (friendsOf) {
      const { data: friendships } = await db
        .from('friendships')
        .select('friend_id')
        .eq('student_id', parseInt(friendsOf));

      const friendIdSet = new Set(
        (friendships || []).map((f: { friend_id: number }) => f.friend_id)
      );
      friendIdSet.add(parseInt(friendsOf)); // Include self
      entries = entries.filter((e: { id: number }) => friendIdSet.has(e.id));
    }

    return NextResponse.json({ leaderboard: entries });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return NextResponse.json({ leaderboard: [] });
  }
}
