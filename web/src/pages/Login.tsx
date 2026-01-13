import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useAuthStore } from '../store/authStore';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
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
    setLoading(true);

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
      setLoading(false);
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
      });

      // Render button with a small delay to ensure DOM is ready
      setTimeout(() => {
        const buttonContainer = document.getElementById('google-signin-button');
        if (buttonContainer && window.google?.accounts?.id?.renderButton) {
          // Clear container first
          buttonContainer.innerHTML = '';
          try {
            window.google.accounts.id.renderButton(buttonContainer, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
            });
            console.log('Google Sign In button rendered successfully');
          } catch (renderError: any) {
            console.error('Error rendering Google button:', renderError);
            const errorMessage = renderError?.message || '';
            if (errorMessage.includes('origin is not allowed') || errorMessage.includes('403')) {
              buttonContainer.innerHTML = `
                <div class="text-red-500 text-sm p-2 border border-red-300 rounded bg-red-50">
                  <p class="font-semibold mb-1">⚠️ Lỗi cấu hình Google OAuth</p>
                  <p class="text-xs mb-1">Origin "${window.location.origin}" chưa được thêm vào Google Cloud Console.</p>
                  <p class="text-xs">Xem hướng dẫn: docs/GOOGLE_OAUTH_SETUP.md</p>
                </div>
              `;
            } else {
              buttonContainer.innerHTML = '<div class="text-red-500 text-sm">Lỗi khi tải nút Google Sign In</div>';
            }
          }
        } else {
          console.warn('Button container not found or renderButton not available', {
            hasContainer: !!buttonContainer,
            hasGoogle: !!window.google,
            hasRenderButton: !!window.google?.accounts?.id?.renderButton,
          });
          // Retry after a longer delay
          setTimeout(() => {
            const retryContainer = document.getElementById('google-signin-button');
            if (retryContainer && window.google?.accounts?.id?.renderButton) {
              retryContainer.innerHTML = '';
              try {
                window.google.accounts.id.renderButton(retryContainer, {
                  type: 'standard',
                  theme: 'outline',
                  size: 'large',
                  text: 'signin_with',
                });
                console.log('Google Sign In button rendered on retry');
              } catch (retryError: any) {
                console.error('Error rendering Google button on retry:', retryError);
                const errorMessage = retryError?.message || '';
                if (errorMessage.includes('origin is not allowed') || errorMessage.includes('403')) {
                  retryContainer.innerHTML = `
                    <div class="text-red-500 text-sm p-2 border border-red-300 rounded bg-red-50">
                      <p class="font-semibold mb-1">⚠️ Lỗi cấu hình Google OAuth</p>
                      <p class="text-xs mb-1">Origin "${window.location.origin}" chưa được thêm vào Google Cloud Console.</p>
                      <p class="text-xs">Xem hướng dẫn: docs/GOOGLE_OAUTH_SETUP.md</p>
                    </div>
                  `;
                }
              }
            }
          }, 1000);
        }
      }, 200);
    } catch (error) {
      console.error('Error initializing Google Sign In:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      setAuth(response.data.user, response.data.token);
      
      // Fetch fresh user data to ensure all settings are loaded
      try {
        const userResponse = await api.get('/auth/me');
        console.log('Raw user response from /auth/me (Login page):', userResponse.data);
        if (userResponse.data.user) {
          const userData = userResponse.data.user;
          console.log('User data from /auth/me after login:', {
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
          
          console.log('Processed user data before setAuth (Login page):', {
            learningLanguageIds: userData.learningLanguageIds,
            voiceAccentVersion: userData.voiceAccentVersion
          });
          
          setAuth(userData, response.data.token);
        }
      } catch (fetchError) {
        console.warn('Failed to fetch user data after login:', fetchError);
        // Continue with original user data if fetch fails
      }
      
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập vào Goozi
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>

          {GOOGLE_CLIENT_ID ? (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">Hoặc</span>
                </div>
              </div>

              <div className="w-full flex justify-center">
                <div id="google-signin-button" className="min-h-[40px] flex items-center justify-center"></div>
                {!googleScriptLoaded && (
                  <div className="text-gray-500 text-sm">Đang tải Google Sign In...</div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-sm text-gray-500">
              Google Sign In không khả dụng. Vui lòng kiểm tra cấu hình.
            </div>
          )}

          <div className="text-center">
            <Link to="/register" className="text-sm text-blue-600 hover:text-blue-500">
              Chưa có tài khoản? Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

