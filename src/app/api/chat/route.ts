import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const SYSTEM_PROMPT = `Kamu adalah Kawabel (Kawan Belajar), teman belajar AI yang ramah untuk siswa SD, SMP, dan SMA di Indonesia.

Aturan:
- Jawab dalam Bahasa Indonesia kecuali pelajaran bahasa asing
- Jelaskan langkah demi langkah, seperti guru yang sabar
- Gunakan contoh sederhana yang relevan untuk anak Indonesia
- JANGAN langsung beri jawaban akhir. Tunjukkan langkah-langkahnya, lalu minta siswa mencoba menjawab sendiri. Setelah siswa menjawab, baru verifikasi apakah jawabannya benar atau salah dan jelaskan jika perlu
- Gunakan emoji sesekali agar menyenangkan
- Jika ada gambar soal, baca dan pahami soalnya lalu bantu jelaskan
- Untuk soal matematika, tunjukkan cara pengerjaannya
- Jaga agar jawaban singkat dan mudah dipahami (maks 300 kata)
- Jangan bahas topik yang tidak pantas untuk anak-anak
- PENTING: JANGAN gunakan LaTeX atau notasi matematika seperti \\[, \\], \\frac, \\times, \\(, \\). Tulis matematika dalam teks biasa. Contoh: "2 × (33 + lebar) = 114", bukan "\\[ 2 \\times (33 + lebar) = 114 \\]". Gunakan ×, ÷, ², ³, √ untuk simbol matematika.`;

// Simple profanity check
const BLOCKED_WORDS = [
  'bodoh', 'goblok', 'tolol', 'bangsat', 'anjing', 'babi', 'kontol', 'memek',
  'fuck', 'shit', 'dick', 'pussy', 'porn', 'sex',
];

function containsBlocked(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((w) => lower.includes(w));
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model, student_id } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    // Check for inappropriate content
    const lastMsg = messages[messages.length - 1];
    const textContent = typeof lastMsg?.content === 'string'
      ? lastMsg.content
      : Array.isArray(lastMsg?.content)
        ? lastMsg.content.find((c: { type: string }) => c.type === 'text')?.text || ''
        : '';

    if (containsBlocked(textContent)) {
      return NextResponse.json({
        reply: 'Yuk kita fokus belajar! 📚 Kawabel di sini untuk bantu pelajaranmu. Ada soal atau PR yang perlu dibantu?',
      });
    }

    // Server-side usage enforcement for signed-in users
    if (student_id && student_id > 0) {
      try {
        const db = (await import('@/lib/supabase')).getSupabase();
        const today = new Date().toISOString().slice(0, 10);

        // Get or create daily usage
        const { data: usage } = await db
          .from('daily_usage')
          .select('chats')
          .eq('student_id', student_id)
          .eq('date', today)
          .single();

        // Check subscription
        const { data: sub } = await db
          .from('subscriptions')
          .select('plan, trial_start_date, premium_until')
          .eq('student_id', student_id)
          .single();

        const isPremium = sub && (
          (sub.plan === 'premium' && sub.premium_until && today <= sub.premium_until) ||
          (sub.plan === 'trial' && sub.trial_start_date &&
            Math.floor((new Date(today).getTime() - new Date(sub.trial_start_date).getTime()) / 86400000) < 7)
        );

        const limit = isPremium ? 100 : 5;
        const currentChats = usage?.chats ?? 0;

        if (currentChats >= limit) {
          return NextResponse.json({
            reply: isPremium
              ? 'Kamu sudah banyak belajar hari ini! Istirahat dulu ya, lanjut besok.'
              : 'Batas chat harian tercapai (5/hari). Upgrade ke Premium untuk unlimited! 🌟',
          });
        }

        // Increment usage
        await db.from('daily_usage').upsert({
          student_id,
          date: today,
          chats: currentChats + 1,
          photos: usage ? undefined : 0,
          quizzes: usage ? undefined : 0,
          dictations: usage ? undefined : 0,
        }, { onConflict: 'student_id,date' });
      } catch (err) {
        console.error('Usage check error:', err);
        // Don't block on usage check failure — continue
      }
    }

    // Use gpt-4o for all requests (better accuracy for math & reasoning)
    const useModel = model === 'full' ? 'gpt-4o' : 'gpt-4o';

    const completion = await getOpenAI().chat.completions.create({
      model: useModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'Maaf, coba tanya lagi ya!';

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: 'Gagal memproses pertanyaan. Coba lagi nanti.' },
      { status: 500 },
    );
  }
}
