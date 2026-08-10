import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Sora } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { SiteShell } from '@/components/layout/site-shell';
import { AuthProvider } from '@/features/auth/auth-provider';
import { PwaRegister } from '@/components/pwa-register';
import './globals.css';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const sora = Sora({
  variable: '--font-heading',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GeekBaku',
  description: 'GeekBaku frontend',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    // Sin esto, iOS abre el link "Agregar a inicio" en Safari normal (con
    // barra de direcciones) en vez de en modo standalone.
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GeekBaku',
  },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <AuthProvider>
              <TooltipProvider delay={200}>
                <SiteShell>{children}</SiteShell>
              </TooltipProvider>
              <Toaster position="top-right" />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
