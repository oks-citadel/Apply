import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JobPilot AI - Your AI-Powered Job Application Assistant',
  description: 'Automate your job search with AI-powered resume customization, cover letter generation, and application tracking.',
  keywords: 'job search, AI, resume, cover letter, job application, career',
  authors: [{ name: 'JobPilot AI Team' }],
  openGraph: {
    title: 'JobPilot AI - Your AI-Powered Job Application Assistant',
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
      </body>
    </html>
  );
}
