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
  title: 'Kawabel — Kawan Belajar',
  description: 'Teman belajar AI-mu. Tanya PR, latihan ujian, dikte Mandarin, dan banyak lagi!',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title: 'Kawabel — Kawan Belajar',
    description: 'Teman belajar AI-mu. Tanya PR, latihan ujian, dikte Mandarin, dan banyak lagi! 🦉',
    url: 'https://kawabel.com',
    siteName: 'Kawabel',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kawabel — Kawan Belajar',
    description: 'Teman belajar AI-mu. Tanya PR, latihan ujian, dikte Mandarin!',
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
