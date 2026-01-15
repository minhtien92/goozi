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
        // Create a new user object to avoid mutation issues
        const userToStore = { ...user };
        console.log('AuthStore - setAuth called:', {
          userId: user?.id,
          learningLanguageIds: user?.learningLanguageIds,
          learningLanguageIdsType: typeof user?.learningLanguageIds,
          learningLanguageIdsIsArray: Array.isArray(user?.learningLanguageIds),
          voiceAccentVersion: user?.voiceAccentVersion,
          voiceAccentVersionType: typeof user?.voiceAccentVersion,
          nativeLanguage: user?.nativeLanguage,
          hasToken: !!token,
          fullUser: user
        });
        
        // Ensure learningLanguageIds is an array
        if (userToStore?.learningLanguageIds) {
          if (typeof userToStore.learningLanguageIds === 'string') {
            try {
              userToStore.learningLanguageIds = JSON.parse(userToStore.learningLanguageIds);
              console.log('Parsed learningLanguageIds in setAuth:', userToStore.learningLanguageIds);
            } catch (e) {
              console.warn('Failed to parse learningLanguageIds in setAuth:', e);
              userToStore.learningLanguageIds = [];
            }
          } else if (!Array.isArray(userToStore.learningLanguageIds)) {
            console.warn('learningLanguageIds is not an array, converting:', userToStore.learningLanguageIds);
            userToStore.learningLanguageIds = [];
          }
        }
        
        // Ensure voiceAccentVersion is a number
        if (userToStore?.voiceAccentVersion !== undefined && userToStore?.voiceAccentVersion !== null) {
          userToStore.voiceAccentVersion = parseInt(String(userToStore.voiceAccentVersion), 10) || 1;
          console.log('Parsed voiceAccentVersion in setAuth:', userToStore.voiceAccentVersion);
        }
        
        console.log('AuthStore - Setting user with processed data:', {
          learningLanguageIds: userToStore?.learningLanguageIds,
          voiceAccentVersion: userToStore?.voiceAccentVersion,
          nativeLanguage: userToStore?.nativeLanguage
        });
        
        set({ user: userToStore, token });
        
        // Log after set to verify
        const state = get();
        console.log('AuthStore - State after set:', {
          userId: state.user?.id,
          learningLanguageIds: state.user?.learningLanguageIds,
          voiceAccentVersion: state.user?.voiceAccentVersion
        });
      },
      logout: () => {
        console.log('AuthStore - Logout called');
        set({ user: null, token: null });
      },
      isAuthenticated: () => {
        return !!get().token && !!get().user;
      },
    }),
    {
      name: 'auth-storage',
      // Ensure proper serialization
      serialize: (state) => {
        console.log('AuthStore - Serializing state:', {
          userId: state.state?.user?.id,
          learningLanguageIds: state.state?.user?.learningLanguageIds,
          voiceAccentVersion: state.state?.user?.voiceAccentVersion
        });
        return JSON.stringify(state);
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        console.log('AuthStore - Deserializing state (raw):', {
          userId: parsed.state?.user?.id,
          learningLanguageIds: parsed.state?.user?.learningLanguageIds,
          voiceAccentVersion: parsed.state?.user?.voiceAccentVersion,
          fullUser: parsed.state?.user
        });
        
        // If user exists but missing fields, try to preserve what we have
        if (parsed.state?.user) {
          const user = parsed.state.user;
          console.log('AuthStore - User object from deserialize:', {
            id: user.id,
            email: user.email,
            name: user.name,
            learningLanguageIds: user.learningLanguageIds,
            voiceAccentVersion: user.voiceAccentVersion,
            nativeLanguage: user.nativeLanguage,
            allKeys: Object.keys(user)
          });
        }
        
        return parsed;
      },
    }
  )
);

// Export store instance for getState() access
export const authStore = useAuthStore;

