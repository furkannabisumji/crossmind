import "./globals.css";
import { Inter } from "next/font/google";

// Load Inter font with subsets to prevent layout shift
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { WalletProvider } from "@/components/wallet-provider";
import { NavigationMenu } from "@/components/navigation-menu";
import { Toaster } from "@/components/ui/toaster";
import { CSSStabilizer } from "@/components/css-stabilizer";
import { ClientRainbowKitWrapper } from "@/components/providers/client-only-rainbow-kit";
import { StrategyProvider } from "@/contexts/StrategyContext";

export const metadata: Metadata = {
  title: "CrossMind - Autonomous Web3 Investment Agent",
  description:
    "AI-powered autonomous DeFi agent that dynamically manages funds across multiple chains and protocols to maximize returns.",
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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ClientRainbowKitWrapper>
            <WalletProvider>
              <StrategyProvider>
                <CSSStabilizer>
                  <div className="flex flex-col min-h-screen">
                    <NavigationMenu />
                    <main className="flex-1">{children}</main>
                    <Toaster />
                  </div>
                </CSSStabilizer>
              </StrategyProvider>
            </WalletProvider>
          </ClientRainbowKitWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
