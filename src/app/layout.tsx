import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { CriticalErrorBoundary } from '@/components/error/ErrorBoundary';
import { ToastProvider } from '@/components/error/ToastProvider';
import { PerformanceProvider, PerformanceDebugger } from '@/components/providers/PerformanceProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MobileMatrix - AI-Powered Phone Comparison Platform',
  description: 'Compare phones with AI assistance. Get detailed specifications, pricing, and personalized recommendations for all phones launched in India.',
  keywords: 'phone comparison, mobile comparison, smartphone specs, phone prices India, AI phone recommendations',
  authors: [{ name: 'MobileMatrix Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ff6b35',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CriticalErrorBoundary>
          <PerformanceProvider>
            <ToastProvider position="top-right" maxToasts={5}>
              {children}
            </ToastProvider>
            <PerformanceDebugger />
          </PerformanceProvider>
        </CriticalErrorBoundary>
      </body>
    </html>
  );
}
