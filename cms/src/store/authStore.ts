import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: {
    topics?: boolean;
    vocabularies?: boolean;
    home?: boolean;
    users?: boolean;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      normalizeUser: (user: User) => {
        if (!user) return user;
        if (user.role === 'admin') {
          // If permissions missing, default to false; only explicit true is allowed
          const perms = user.permissions || {};
          return {
            ...user,
            permissions: {
              topics: perms.topics === undefined ? false : perms.topics,
              vocabularies: perms.vocabularies === undefined ? false : perms.vocabularies,
              home: perms.home === undefined ? false : perms.home,
              users: perms.users === undefined ? false : perms.users,
            },
          };
        }
        return user;
      },
      setAuth: (user, token) => {
        const normalizedUser = (get() as any).normalizeUser
          ? (get() as any).normalizeUser(user)
          : user;
        localStorage.setItem('token', token);
        set({ user: normalizedUser, token });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
      isAuthenticated: () => {
        return !!get().token && !!get().user;
      },
      isAdmin: () => {
        return get().user?.role === 'admin';
      },
    }),
    {
      name: 'auth-storage',
      version: 2,
      migrate: (persistedState: any) => {
        if (!persistedState) return persistedState;
        const normalizeUser = (user: User) => {
          if (!user) return user;
          if (user.role === 'admin') {
            const perms = user.permissions || {};
            return {
              ...user,
              permissions: {
                topics: perms.topics === undefined ? false : perms.topics,
                vocabularies: perms.vocabularies === undefined ? false : perms.vocabularies,
                home: perms.home === undefined ? false : perms.home,
                users: perms.users === undefined ? false : perms.users,
              },
            };
          }
          return user;
        };

        return {
          ...persistedState,
          user: normalizeUser(persistedState.user),
        };
      },
    }
  )
);

