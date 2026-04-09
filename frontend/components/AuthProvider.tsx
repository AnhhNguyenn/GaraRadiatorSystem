"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const handleAuthError = () => {
      // Khi event 401 được bắn ra từ apiClient, chúng ta redirect mềm mại tại đây
      router.push('/login');
    };

    window.addEventListener('auth_error_401', handleAuthError);

    return () => {
      window.removeEventListener('auth_error_401', handleAuthError);
    };
  }, [router]);

  return <>{children}</>;
}
