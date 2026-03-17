'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  saveTokens,
  saveUser,
  clearTokens,
  getUser,
  isAuthenticated as checkAuth,
} from '@/lib/auth';
import { User, AuthResponse } from '@/types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Restore session on mount
  useEffect(() => {
    if (checkAuth()) {
      const savedUser = getUser();
      if (savedUser) setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{ success: boolean; data: AuthResponse }>(
        '/auth/login',
        { email, password }
      );
      const { user, accessToken, refreshToken } = data.data;
      saveTokens(accessToken, refreshToken);
      saveUser(user);
      setUser(user);
      router.push('/dashboard');
    },
    [router]
  );
  
const register = useCallback(
  async (email: string, password: string, name?: string) => {
    await api.post<{ success: boolean; data: AuthResponse }>(
      '/auth/register',
      { email, password, name }
    );
    router.push('/login?registered=true');
  },
  [router]
);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    router.push('/login');
  }, [router]);

  return { user, loading, login, register, logout };
};