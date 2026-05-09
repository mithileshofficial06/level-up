import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10">
        <SignIn
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-surface-900 border border-surface-700 shadow-2xl',
              headerTitle: 'text-surface-100',
              headerSubtitle: 'text-surface-400',
              formFieldLabel: 'text-surface-300',
              formFieldInput: 'bg-surface-800 border-surface-600 text-surface-100',
              formButtonPrimary: 'bg-primary-600 hover:bg-primary-500',
              footerActionLink: 'text-primary-400 hover:text-primary-300',
              socialButtonsBlockButton:
                'bg-surface-800 border border-surface-600 text-surface-200 hover:bg-surface-700 hover:border-surface-500 transition-all',
              socialButtonsBlockButtonText: 'text-surface-200 font-medium',
              dividerLine: 'bg-surface-700',
              dividerText: 'text-surface-500',
            },
          }}
        />
      </div>
    </div>
  );
}
