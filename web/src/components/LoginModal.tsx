import { useState, useEffect } from 'react';
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

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [error, setError] = useState('');
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Debug: Log Google Client ID and current origin (remove in production)
  useEffect(() => {
    if (GOOGLE_CLIENT_ID) {
      console.log('Google Client ID loaded:', GOOGLE_CLIENT_ID.substring(0, 20) + '...');
      console.log('Current origin:', window.location.origin);
      console.log('Full URL:', window.location.href);
      console.log('⚠️ Đảm bảo origin "' + window.location.origin + '" đã được thêm vào Google Cloud Console');
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
        console.log('Raw user response from /auth/me (Google):', userResponse.data);
        if (userResponse.data.user) {
          const userData = userResponse.data.user;
          console.log('User data from /auth/me after Google login:', {
            learningLanguageIds: userData.learningLanguageIds,
            learningLanguageIdsType: typeof userData.learningLanguageIds,
            learningLanguageIdsIsArray: Array.isArray(userData.learningLanguageIds),
            voiceAccentVersion: userData.voiceAccentVersion,
            voiceAccentVersionType: typeof userData.voiceAccentVersion,
            nativeLanguage: userData.nativeLanguage,
            fullUser: userData
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
          
          console.log('Processed user data before setAuth (Google):', {
            learningLanguageIds: userData.learningLanguageIds,
            voiceAccentVersion: userData.voiceAccentVersion
          });
          
          setAuth(userData, authResponse.data.token);
        }
      } catch (fetchError) {
        console.warn('Failed to fetch user data after login:', fetchError);
        // Continue with original user data if fetch fails
      }
      
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Đăng nhập Google thất bại');
    }
  };

  useEffect(() => {
    if (!isOpen) return;

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
  }, [GOOGLE_CLIENT_ID, isOpen]);

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
        const buttonContainer = document.getElementById('google-signin-button-modal');
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
          } catch (renderError) {
            console.error('Error rendering Google button:', renderError);
            buttonContainer.innerHTML = '<div class="text-red-500 text-sm">Lỗi khi tải nút Google Sign In</div>';
          }
        } else {
          console.warn('Button container not found or renderButton not available', {
            hasContainer: !!buttonContainer,
            hasGoogle: !!window.google,
            hasRenderButton: !!window.google?.accounts?.id?.renderButton,
          });
          // Retry after a longer delay
          setTimeout(() => {
            const retryContainer = document.getElementById('google-signin-button-modal');
            if (retryContainer && window.google?.accounts?.id?.renderButton) {
              retryContainer.innerHTML = '';
              window.google.accounts.id.renderButton(retryContainer, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
              });
              console.log('Google Sign In button rendered on retry');
            }
          }, 1000);
        }
      }, 200);
    } catch (error) {
      console.error('Error initializing Google Sign In:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-50">
        <div className="p-8">
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {GOOGLE_CLIENT_ID ? (
            <div className="w-full flex justify-center">
              <div 
                id="google-signin-button-modal" 
                className="min-h-[60px] w-full max-w-[500px] flex items-center justify-center scale-125"
              ></div>
              {!googleScriptLoaded && (
                <div className="text-gray-500 text-sm text-center mt-2">Đang tải Google Sign In...</div>
              )}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500">
              Google Sign In không khả dụng. Vui lòng kiểm tra cấu hình.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
