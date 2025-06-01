"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useWallet } from '@/components/wallet-provider';
import { 
  Brain, 
  LayoutDashboard, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Menu, 
  X 
} from 'lucide-react';

export function NavigationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { isConnected, account, connect, disconnect } = useWallet();

  const navItems = [
    { href: '/', label: 'Home', icon: <Brain className="h-5 w-5" /> },
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/dashboard/deposit', label: 'Deposit', icon: <CreditCard className="h-5 w-5" /> },
    { href: '/dashboard/strategies', label: 'Strategies', icon: <BarChart3 className="h-5 w-5" /> },
    { href: '/dashboard/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="hidden text-xl font-bold sm:inline-block">CrossMind</span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex md:gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={disconnect}
              className="hidden sm:flex"
            >
              {account?.substring(0, 6)}...{account?.substring(account.length - 4)}
            </Button>
          ) : (
            <Button size="sm" onClick={connect} className="hidden sm:flex">
              Connect Wallet
            </Button>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      {isOpen && (
        <div className="container pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent ${
                  pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            {!isConnected && (
              <Button onClick={connect} className="mt-2">
                Connect Wallet
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}