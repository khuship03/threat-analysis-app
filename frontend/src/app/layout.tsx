import type { Metadata } from 'next';
import { Playfair_Display, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const sourceSerif = Source_Serif_4({
  variable: '--font-source-serif',
  subsets: ['latin'],
  weight: ['300', '400', '600'],
});

export const metadata: Metadata = {
  title: 'Threat Analysis App',
  description: 'AI-powered log threat detection and analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${sourceSerif.variable} antialiased bg-gray-950 text-gray-100 min-h-screen`}
        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
      >
        {children}
      </body>
    </html>
  );
}