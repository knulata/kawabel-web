import type { Metadata, Viewport } from 'next';
import { Poppins, Nunito } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kawabel.com'),
  title: 'Kawabel — Kawan Belajar AI',
  description: 'Foto PR-mu, langsung dijawab AI. Latihan ujian, dikte Mandarin, dan raih skor tertinggi — gratis!',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Kawabel — Kawan Belajar AI 🦉',
    description: 'Foto PR-mu, langsung dijawab AI. Latihan ujian, dikte Mandarin, dan raih skor tertinggi — gratis!',
    url: 'https://kawabel.com',
    siteName: 'Kawabel',
    images: [{ url: '/favicon.png', width: 512, height: 512 }],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Kawabel — Kawan Belajar AI 🦉',
    description: 'Foto PR-mu, langsung dijawab AI. Latihan ujian, dikte Mandarin — gratis!',
    images: ['/favicon.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kawabel',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4CAF50',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${poppins.variable} ${nunito.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
