import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import UserMenu from '../components/UserMenu';
import LoginModal from '../components/LoginModal';
import api from '../config/api';
import logoHeader from '../assets/img/logo.png';
import smallLogo from '../assets/img/small-logo.svg';
import btnAccount from '../assets/img/btn-account.svg';

export default function Home() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [slogans, setSlogans] = useState<string[]>([]);
  const [heroImage, setHeroImage] = useState<string>('');
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroImageError, setHeroImageError] = useState(false);
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    fetchHomeSettings();
  }, [user?.nativeLanguage?.code]);

  // Fetch user data if logged in but missing settings
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id && (!user.learningLanguageIds || !user.voiceAccentVersion)) {
        try {
          console.log('Home - Fetching user data because settings are missing');
          const userResponse = await api.get('/auth/me');
          if (userResponse.data.user) {
            const userData = userResponse.data.user;
            console.log('Home - User data from /auth/me:', {
              learningLanguageIds: userData.learningLanguageIds,
              voiceAccentVersion: userData.voiceAccentVersion
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
            
            // Update store
            const { setAuth, token } = useAuthStore.getState();
            if (token) {
              setAuth(userData, token);
            }
          }
        } catch (error) {
          console.error('Home - Error fetching user data:', error);
        }
      }
    };
    
    fetchUserData();
  }, [user?.id]);

  useEffect(() => {
    if (slogans.length > 1) {
      const interval = setInterval(() => {
        setCurrentSloganIndex((prev) => (prev + 1) % slogans.length);
      }, 30000); // Change slogan every 30 seconds
      return () => clearInterval(interval);
    }
  }, [slogans]);

  // Rotate hero pictures every 30 seconds if there are multiple
  useEffect(() => {
    if (heroImages.length > 1) {
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % heroImages.length;
        setHeroImage(heroImages[index]);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [heroImages]);

  const fetchHomeSettings = async () => {
    try {
      const response = await api.get('/home-settings/active');
      const settings = response.data.settings;
      
      const currentLang = user?.nativeLanguage?.code || 'en';

      // Get slogans (CMS lưu đa ngôn ngữ trong value dạng JSON { [langCode]: text })
      const sloganSettings = settings.filter((s: any) => s.key === 'slogan');
      sloganSettings.sort((a: any, b: any) => a.order - b.order);
      const sloganValues = sloganSettings.map((s: any) => {
        const rawValue = s.value;
        if (!rawValue) return '';
        try {
          const parsed = JSON.parse(rawValue);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const map = parsed as Record<string, string>;
            return (
              map[currentLang] ||
              map[currentLang.toLowerCase()] ||
              map['en'] ||
              map['EN'] ||
              Object.values(map)[0] ||
              rawValue
            );
          }
        } catch {
          // value không phải JSON, dùng nguyên bản
        }
        return rawValue;
      });
      if (sloganValues.length > 0) {
        setSlogans(sloganValues);
      }

      // Get hero image from 'picture'
      // Only remove /api at the end of URL, not in the middle (e.g., api.goozi.org)
      const viteApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const baseUrl = viteApiUrl.endsWith('/api') ? viteApiUrl.slice(0, -4) : viteApiUrl.replace(/\/api$/, '') || 'http://localhost:3001';
      const pictureSettings = settings.filter((s: any) => s.key === 'picture');
      if (pictureSettings.length > 0) {
        const sorted = [...pictureSettings].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        const heroUrls = sorted
          .map((s: any) => {
            if (!s.value) return null;
            return s.value.startsWith('http') ? s.value : `${baseUrl}${s.value}`;
          })
          .filter(Boolean) as string[];
        
        if (heroUrls.length > 0) {
          setHeroImages(heroUrls);
          setHeroImage(heroUrls[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching home settings:', error);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const response = await api.get('/testimonials/active');
      const sorted = response.data.testimonials.sort((a: any, b: any) => 
        (a.order || 0) - (b.order || 0)
      );
      setTestimonials(sorted);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Auto-open login modal if on /login route
  useEffect(() => {
    if (location.pathname === '/login' && !user) {
      setLoginModalOpen(true);
    }
  }, [location.pathname, user]);

  const backgroundStyle = {
    background: 'linear-gradient(to bottom, #11BBDD, #F2F4F6)',
  };

  // Check if we're being used as background (via parent class or prop)
  // /login should be treated as main page, not background
  const isBackground = window.location.pathname !== '/' && window.location.pathname !== '/login';
  
  return (
    <div 
      className={`min-h-screen relative overflow-hidden w-full h-full ${isBackground ? 'pointer-events-none' : ''}`} 
      style={{ ...backgroundStyle, ...(isBackground ? { zIndex: 0 } : {}) }}
    >
      {/* Logo Menu */}
      {!isBackground && logoMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setLogoMenuOpen(false)}
          />
          {/* Menu */}
          <div className="fixed left-0 top-0 h-full w-80 bg-white z-50 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="text-2xl font-bold text-cyan-500 flex items-center gap-2">
                <span>GOOZI</span>
              </div>
              <button
                onClick={() => setLogoMenuOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Menu Items */}
            <div className="p-6">
              <nav className="space-y-2">
                <button
                  onClick={() => {
                    setLogoMenuOpen(false);
                    // Handle Support action
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition text-left"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className="font-medium">Support</span>
                </button>
                
                <button
                  onClick={() => {
                    setLogoMenuOpen(false);
                    // Handle About action
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition text-left"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">About</span>
                </button>
              </nav>
            </div>
            
            {/* Left border accent */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500"></div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className={`relative ${isBackground ? 'z-0' : 'z-10'}`} style={{ position: 'relative' }}>
        {/* Header */}
        {!isBackground && (
          <header className="relative flex justify-between items-center p-6 2xl:p-8">
          {/* Left: G icon - clickable */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLogoMenuOpen(true)}
              className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition cursor-pointer"
            >
              <img src={smallLogo} alt="Goozi logo" className="w-6 h-6" />
            </button>
          </div>

          {/* Center: logo image - not clickable */}
          <div className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none mt-8">
            <img src={logoHeader} alt="Goozi logo" className="h-10 md:h-12" />
          </div>

          {/* Right: user / login */}
          <div className="flex items-center gap-4 text-white drop-shadow-lg">
            {user ? (
              <button
                onClick={() => setUserMenuOpen(true)}
                className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer"
              >
                <span>{user?.name || 'User'}</span>
              </button>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition cursor-pointer"
              >
                <img src={btnAccount} alt="Login" className="w-10 h-10" />
              </button>
            )}
          </div>
          </header>
        )}

        {/* Main Content Area */}
        <div className="px-6 2xl:px-10 3xl:px-12 pb-24 flex flex-col items-center justify-between min-h-[calc(100vh-140px)] pt-8 2xl:pt-10">
          {/* Tagline */}
          <div className="text-center w-full">
            {slogans.length > 0 ? (
              <p className="text-2xl md:text-3xl 2xl:text-4xl font-medium text-gray-900">
                {slogans[currentSloganIndex]}
              </p>
            ) : (
              <p className="text-2xl md:text-3xl 2xl:text-4xl font-medium text-gray-900">
                The more languages you learn, the easier it becomes
              </p>
            )}
          </div>

          {/* Hero picture from settings */}
          {heroImage && !heroImageError && (
            <div className="flex justify-center w-full flex-1 items-center">
              <img
                src={heroImage}
                alt="Hero"
                className="w-[70vw] max-h-[450px] 2xl:max-h-[500px] 3xl:max-h-[560px] object-contain"
                onError={() => setHeroImageError(true)}
              />
            </div>
          )}

          {/* Testimonials */}
          {testimonials.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl mx-auto w-full mt-8 md:mt-10">
              {testimonials.slice(0, 3).map((testimonial: any) => (
                <div key={testimonial.id} className="bg-gray-100 rounded-lg p-6 shadow-md">
                  <p className="text-gray-600 text-sm mb-4 italic">
                    "{testimonial.quote}"
                  </p>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {testimonial.name}
                  </h3>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Left Ad Banner - Hidden */}
        {/* <div className="fixed left-0 top-0 bottom-0 w-16 bg-yellow-400 flex items-center justify-center z-20">
          <div className="transform -rotate-90 text-sm font-medium text-gray-800 whitespace-nowrap">
            ADS - LEFT
          </div>
        </div> */}

        {/* Right Ad Banner - Hidden */}
        {/* <div className="fixed right-0 top-0 bottom-0 w-16 bg-yellow-400 flex items-center justify-center z-20">
          <div className="transform -rotate-90 text-sm font-medium text-gray-800 whitespace-nowrap">
            ADS - RIGHT
          </div>
        </div> */}

        {/* Navigation CTA (Bottom Right) */}
        {!isBackground && (
          <div className="fixed bottom-20 right-6 z-30">
            <button
              onClick={() => {
                if (user) {
                  navigate('/topics');
                } else {
                  setLoginModalOpen(true);
                }
              }}
              className="w-36 h-36 rounded-full bg-gradient-to-br from-cyan-300 to-sky-500 text-white font-semibold shadow-xl border border-white/50 hover:scale-105 active:scale-95 transition transform flex items-center justify-center text-center text-lg"
            >
              Let&apos;s study!
            </button>
          </div>
        )}

      </div>

      {/* User Menu */}
      {!isBackground && userMenuOpen && (
        <UserMenu onClose={() => setUserMenuOpen(false)} />
      )}

      {/* Login Modal */}
      {!isBackground && (
        <LoginModal 
          isOpen={loginModalOpen}
          onClose={() => {
            setLoginModalOpen(false);
            // If on /login route, navigate to home when closing modal
            if (location.pathname === '/login') {
              navigate('/');
            }
          }}
          onSuccess={() => {
            // Close modal and navigate to home if on /login route
            setLoginModalOpen(false);
            if (location.pathname === '/login') {
              navigate('/');
            } else {
              // Refresh page or update state after successful login
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
}
