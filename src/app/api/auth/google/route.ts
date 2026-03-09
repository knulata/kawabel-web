import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { id_token } = await req.json();
    if (!id_token) {
      return NextResponse.json({ error: 'ID token required' }, { status: 400 });
    }

    // Verify Google token
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`,
    );
    if (!res.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const googleUser = await res.json();
    const { email, name, picture, sub: googleId } = googleUser;

    if (!email) {
      return NextResponse.json({ error: 'Email not found in token' }, { status: 400 });
    }

    const db = getSupabase();

    // Find or create student
    const { data: existing } = await db
      .from('students')
      .select('*')
      .eq('email', email)
      .single();

    if (existing) {
      // Update avatar if changed
      if (picture && picture !== existing.avatar_url) {
        await db.from('students').update({ avatar_url: picture }).eq('id', existing.id);
        existing.avatar_url = picture;
      }
      return NextResponse.json({ student: existing });
    }

    // Create new student
    const { data: newStudent, error } = await db
      .from('students')
      .insert({
        name: name || email.split('@')[0],
        email,
        avatar_url: picture || null,
        google_id: googleId,
        grade: 'SD',
        stars: 0,
        level: 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Create student error:', error);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    return NextResponse.json({ student: newStudent });
  } catch (err) {
    console.error('Auth error:', err);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
