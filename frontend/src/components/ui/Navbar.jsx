'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { LayoutDashboard, Mic } from 'lucide-react';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/setup', label: 'New Interview', icon: Mic },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  if (pathname === '/interview') return null;

  return (
    <motion.nav
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 bg-surface-950/80 backdrop-blur-xl border-b border-surface-700/30"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isSignedIn ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-surface-50">
              Level<span className="text-primary-500">Up</span>
            </span>
          </Link>

          {/* Nav Links */}
          {isSignedIn && (
            <div className="hidden sm:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`
                      relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'text-primary-500 bg-primary-500/8'
                        : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary-500 rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right */}
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8 ring-2 ring-surface-700/50 hover:ring-primary-500/30 transition-all',
                  },
                }}
              />
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/sign-in" className="px-4 py-2 text-sm font-medium text-surface-400 hover:text-surface-100 transition-colors">
                  Sign In
                </Link>
                <Link href="/sign-up" className="px-5 py-2 text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
