import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata = {
  title: 'LevelUp AI — AI-Powered Mock Interview Platform',
  description: 'Practice interviews with AI, get real-time feedback on body language, communication, and technical skills. Built for college students.',
  keywords: 'mock interview, AI interview, interview practice, body language analysis, technical interview',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      appearance={{
        layout: { unsafe_disableDevelopmentModeWarnings: true },
      }}
    >
      <html lang="en" className="dark">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800&display=swap" rel="stylesheet" />
        </head>
        <body className="antialiased grain">
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f1c18',
                color: '#f5ede0',
                border: '1px solid rgba(84, 104, 119, 0.2)',
                borderRadius: '10px',
                fontSize: '14px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              },
              success: { iconTheme: { primary: '#34d399', secondary: '#f5ede0' } },
              error: { iconTheme: { primary: '#f87171', secondary: '#f5ede0' } },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
