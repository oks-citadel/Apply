import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { CookieConsent } from '@/components/common/CookieConsent';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ApplyForUs - Your AI-Powered Job Application Assistant',
  description: 'Automate your job search with AI-powered resume customization, cover letter generation, and application tracking.',
  keywords: 'job search, AI, resume, cover letter, job application, career',
  authors: [{ name: 'ApplyForUs Team' }],
  openGraph: {
    title: 'ApplyForUs - Your AI-Powered Job Application Assistant',
    description: 'Automate your job search with AI-powered resume customization, cover letter generation, and application tracking.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
    </html>
  );
}
