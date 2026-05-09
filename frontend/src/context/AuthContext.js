'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && clerkUser) {
        setProfile({
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          name: clerkUser.fullName || clerkUser.firstName || '',
          avatarUrl: clerkUser.imageUrl,
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  const updateProfile = (data) => {
    setProfile((prev) => ({ ...prev, ...data }));
  };

  const clearProfile = () => {
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        setProfile,
        updateProfile,
        clearProfile,
        loading,
        isSignedIn,
        isLoaded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
