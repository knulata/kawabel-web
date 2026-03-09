import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Kawabel — Kawan Belajar AI';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #81C784 0%, #4CAF50 50%, #388E3C 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            left: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            right: -30,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 80,
            right: 200,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
          }}
        />

        {/* Owl mascot */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 16px 60px rgba(0,0,0,0.2)',
            marginRight: 70,
            fontSize: 120,
            flexShrink: 0,
          }}
        >
          🦉
        </div>

        {/* Text content */}
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 600 }}>
          <div
            style={{
              fontSize: 86,
              fontWeight: 900,
              color: 'white',
              letterSpacing: 2,
              lineHeight: 1,
              textShadow: '0 2px 10px rgba(0,0,0,0.15)',
            }}
          >
            kawabel
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.85)',
              marginTop: 10,
              letterSpacing: 1,
            }}
          >
            Kawan Belajar AI
          </div>
          <div
            style={{
              fontSize: 24,
              color: 'rgba(255,255,255,0.7)',
              marginTop: 24,
              lineHeight: 1.5,
            }}
          >
            Foto PR-mu, langsung dijawab AI. Latihan ujian, dikte Mandarin — gratis!
          </div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 28,
            }}
          >
            {['📷 Foto PR', '✍️ Dikte', '📝 Ujian', '🏆 Juara'].map((label) => (
              <div
                key={label}
                style={{
                  padding: '8px 18px',
                  borderRadius: 24,
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
