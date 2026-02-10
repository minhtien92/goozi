import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useAuthStore } from '../store/authStore';
import logoLogin from '../assets/img/logo_login.png';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

export default function Login() {
  const [error, setError] = useState('');
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [googleStarting, setGoogleStarting] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  
  // Debug: Log Google Client ID and current origin (remove in production)
  useEffect(() => {
    if (GOOGLE_CLIENT_ID) {
      console.log('Google Client ID loaded:', GOOGLE_CLIENT_ID.substring(0, 20) + '...');
      console.log('Current origin:', window.location.origin);
      console.log('Full URL:', window.location.href);
      console.log('⚠️ Đảm bảo origin "' + window.location.origin + '" đã được thêm vào Google Cloud Console');
      console.log('📖 Hướng dẫn chi tiết: Xem file docs/GOOGLE_OAUTH_SETUP.md');
    } else {
      console.warn('Google Client ID not found in environment variables');
    }
  }, [GOOGLE_CLIENT_ID]);

  const handleGoogleSignIn = async (response: any) => {
    setError('');

    try {
      const authResponse = await api.post('/auth/google', {
        idToken: response.credential,
      });
      setAuth(authResponse.data.user, authResponse.data.token);
      
      // Fetch fresh user data to ensure all settings are loaded
      try {
        const userResponse = await api.get('/auth/me');
        console.log('Raw user response from /auth/me (Google - Login page):', userResponse.data);
        if (userResponse.data.user) {
          const userData = userResponse.data.user;
          console.log('User data from /auth/me after Google login:', {
            learningLanguageIds: userData.learningLanguageIds,
            learningLanguageIdsType: typeof userData.learningLanguageIds,
            learningLanguageIdsIsArray: Array.isArray(userData.learningLanguageIds),
            voiceAccentVersion: userData.voiceAccentVersion,
            voiceAccentVersionType: typeof userData.voiceAccentVersion,
            nativeLanguage: userData.nativeLanguage
          });
          
          // Ensure learningLanguageIds is an array
          if (userData.learningLanguageIds && typeof userData.learningLanguageIds === 'string') {
            try {
              userData.learningLanguageIds = JSON.parse(userData.learningLanguageIds);
            } catch (e) {
              console.warn('Failed to parse learningLanguageIds:', e);
            }
          }
          
          // Ensure voiceAccentVersion is a number
          if (userData.voiceAccentVersion !== undefined && userData.voiceAccentVersion !== null) {
            userData.voiceAccentVersion = parseInt(userData.voiceAccentVersion) || 1;
          }
          
          console.log('Processed user data before setAuth (Google - Login page):', {
            learningLanguageIds: userData.learningLanguageIds,
            voiceAccentVersion: userData.voiceAccentVersion
          });
          
          setAuth(userData, authResponse.data.token);
        }
      } catch (fetchError) {
        console.warn('Failed to fetch user data after login:', fetchError);
        // Continue with original user data if fetch fails
      }
      
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Đăng nhập Google thất bại');
    } finally {
    }
  };

  useEffect(() => {
    // Load Google Identity Services script
    if (GOOGLE_CLIENT_ID && !window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Identity Services script loaded');
        setGoogleScriptLoaded(true);
        initializeGoogleSignIn();
      };
      script.onerror = () => {
        console.error('Failed to load Google Identity Services script');
      };
      document.body.appendChild(script);
    } else if (GOOGLE_CLIENT_ID && window.google) {
      console.log('Google Identity Services already loaded');
      setGoogleScriptLoaded(true);
      initializeGoogleSignIn();
    }

    // Cleanup
    return () => {
      // Cleanup if needed
    };
  }, [GOOGLE_CLIENT_ID]);

  const initializeGoogleSignIn = () => {
    if (!window.google || !GOOGLE_CLIENT_ID) {
      console.warn('Cannot initialize Google Sign In:', {
        hasGoogle: !!window.google,
        hasClientId: !!GOOGLE_CLIENT_ID,
      });
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
        ux_mode: 'popup',
      });

      console.log('Google Sign In initialized (custom button mode)');
    } catch (error) {
      console.error('Error initializing Google Sign In:', error);
    }
  };



  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-300" />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[720px]">
          <div className="mx-auto w-full max-w-[560px] rounded-[28px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] px-6 sm:px-10 py-10">
            <div className="flex flex-col items-center text-center">
              <img
                src={logoLogin}
                alt="Goozi"
                className="h-20 w-auto object-contain"
              />

              <p className="mt-4 text-sm sm:text-base tracking-wide text-gray-600">
                Please sign in to begin your studies.
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 mt-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="mt-8">
              {GOOGLE_CLIENT_ID ? (
                <>
                  <div className="mt-5 flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        if (!window.google?.accounts?.id?.prompt) return;
                        setGoogleStarting(true);
                        window.google.accounts.id.prompt();
                        setTimeout(() => setGoogleStarting(false), 1500);
                      }}
                      disabled={!googleScriptLoaded || googleStarting}
                      className="inline-flex items-center gap-3 rounded-full border border-sky-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-[0_8px_18px_rgba(2,132,199,0.14)] hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        className="h-5 w-5"
                      />
                      <span>{googleStarting ? 'Đang mở Google...' : 'Đăng nhập bằng Google'}</span>
                    </button>
                  </div>

                  {!googleScriptLoaded && (
                    <div className="mt-3 text-center text-gray-500 text-sm">Đang tải Google Sign In...</div>
                  )}
                </>
              ) : (
                <div className="text-center text-sm text-gray-500">
                  Google Sign In không khả dụng. Vui lòng kiểm tra cấu hình.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

