import './globals.css';
import { Inter } from 'next/font/google';

// Load Inter font with subsets to prevent layout shift
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { WalletProvider } from '@/components/wallet-provider';
import { NavigationMenu } from '@/components/navigation-menu';
import { Toaster } from '@/components/ui/toaster';
import { CSSStabilizer } from '@/components/css-stabilizer';
import { WagmiConfig } from '@/components/providers/wagmi-provider';

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
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Force CSS reload on changes to prevent flashing */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <WagmiConfig>
            <WalletProvider>
              <CSSStabilizer>
                <div className="flex min-h-screen flex-col">
                  <NavigationMenu />
                  <main className="flex-1">{children}</main>
                  <Toaster />
                </div>
              </CSSStabilizer>
            </WalletProvider>
          </WagmiConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}