import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Kawabel — Kawan Belajar';
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
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 80,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 100,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />

        {/* Owl mascot */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            marginRight: 60,
            fontSize: 100,
          }}
        >
          🦉
        </div>

        {/* Text */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: 'white',
              letterSpacing: 3,
              lineHeight: 1,
            }}
          >
            kawabel
          </div>
          <div
            style={{
              fontSize: 26,
              color: 'rgba(255,255,255,0.75)',
              marginTop: 8,
              letterSpacing: 1,
            }}
          >
            kawan belajar
          </div>
          <div
            style={{
              fontSize: 22,
              color: 'rgba(255,255,255,0.55)',
              marginTop: 20,
              maxWidth: 480,
              lineHeight: 1.4,
            }}
          >
            Teman belajar AI-mu. Tanya PR, latihan ujian, dikte Mandarin, dan banyak lagi!
          </div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 24,
            }}
          >
            {['📷 Foto PR', '✍️ Dikte', '📝 Ujian', '🏆 Juara'].map((label) => (
              <div
                key={label}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: 16,
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
