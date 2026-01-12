import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  nativeLanguage?: Language;
  voiceAccentVersion?: number;
  learningLanguageIds?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        set({ user, token });
      },
      logout: () => {
        set({ user: null, token: null });
      },
      isAuthenticated: () => {
        return !!get().token && !!get().user;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

