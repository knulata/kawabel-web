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
- Jangan langsung beri jawaban akhir — bantu siswa memahami prosesnya
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
    const { messages, model } = await req.json();

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

    // Determine model
    const useModel = model === 'full' ? 'gpt-4o' : 'gpt-4o-mini';

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
