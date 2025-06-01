import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { WalletProvider } from '@/components/wallet-provider';
import { NavigationMenu } from '@/components/navigation-menu';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'CrossMind - Autonomous Web3 Investment Agent',
  description: 'AI-powered autonomous DeFi agent that dynamically manages funds across multiple chains and protocols to maximize returns.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <WalletProvider>
            <div className="flex min-h-screen flex-col">
              <NavigationMenu />
              <main className="flex-1">{children}</main>
              <Toaster />
            </div>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}