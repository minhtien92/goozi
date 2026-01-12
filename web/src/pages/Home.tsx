import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LanguageSelector from '../components/LanguageSelector';
import UserMenu from '../components/UserMenu';
import LoginModal from '../components/LoginModal';
import api from '../config/api';
import logo from '../assets/img/logo.svg';

export default function Home() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [slogans, setSlogans] = useState<string[]>([]);
  const [heroImage, setHeroImage] = useState<string>('');
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    fetchHomeSettings();
  }, []);

  useEffect(() => {
    if (slogans.length > 1) {
      const interval = setInterval(() => {
        setCurrentSloganIndex((prev) => (prev + 1) % slogans.length);
      }, 5000); // Change slogan every 5 seconds
      return () => clearInterval(interval);
    }
  }, [slogans]);

  const fetchHomeSettings = async () => {
    try {
      const response = await api.get('/home-settings/active');
      const settings = response.data.settings;
      
      // Get slogans
      const sloganSettings = settings.filter((s: any) => s.key === 'slogan');
      sloganSettings.sort((a: any, b: any) => a.order - b.order);
      const sloganValues = sloganSettings.map((s: any) => s.value);
      if (sloganValues.length > 0) {
        setSlogans(sloganValues);
      }

      // Get hero image from 'picture'
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
      const pictureSettings = settings.filter((s: any) => s.key === 'picture');
      if (pictureSettings.length > 0) {
        const sorted = [...pictureSettings].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        const heroUrl = sorted
          .map((s: any) => {
            if (!s.value) return null;
            return s.value.startsWith('http') ? s.value : `${baseUrl}${s.value}`;
          })
          .filter(Boolean)[0] as string | undefined;
        if (heroUrl) setHeroImage(heroUrl);
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const backgroundStyle = {
    background: 'linear-gradient(to right, #60a5fa, #4fd1c7, #e5e7eb)',
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={backgroundStyle}>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-green-100 transform transition-transform duration-300 z-50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="text-2xl font-bold text-blue-600 mb-8">GOOZI</div>
          <nav className="space-y-4">
            <Link
              to="/"
              className="block text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setSidebarOpen(false)}
            >
              Home
            </Link>
            <button
              onClick={() => {
                setSidebarOpen(false);
                if (user) {
                  navigate('/topics');
                } else {
                  setLoginModalOpen(true);
                }
              }}
              className="block w-full text-left text-gray-700 hover:text-blue-600 font-medium"
            >
              Vocabulary
            </button>
            <Link
              to="/"
              className="block text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setSidebarOpen(false)}
            >
              Phrase
            </Link>
            <Link
              to="/"
              className="block text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setSidebarOpen(false)}
            >
              Sentence
            </Link>
          </nav>
          {user ? (
            <div className="mt-8 pt-8 border-t border-gray-300">
              <div className="text-sm text-gray-600">{user?.name || 'User Name'}</div>
              <div className="text-sm text-gray-500">{user?.email || 'user@email.com'}</div>
              <button
                onClick={handleLogout}
                className="mt-4 text-sm text-gray-700 hover:text-red-600"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="mt-8 pt-8 border-t border-gray-300">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  setLoginModalOpen(true);
                }}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                Đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="relative z-10" style={{ position: 'relative' }}>
        {/* Header */}
        <header className="relative flex justify-between items-center p-6">
          {/* Left: menu + circle icon */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-white hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
          </div>

          {/* Center: logo image - absolutely positioned */}
          <div className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none">
            <img src={logo} alt="Goozi logo" className="h-10 md:h-12" />
          </div>

          {/* Right: user / login */}
          <div className="flex items-center gap-4 text-white drop-shadow-lg">
            {user ? (
              <>
                <LanguageSelector />
                <button
                  onClick={() => setUserMenuOpen(true)}
                  className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl">
                    {user?.nativeLanguage?.flag || '🇰🇷'}
                  </div>
                  <span>{user?.name || 'User'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition font-medium"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <div className="px-6 pb-16 flex flex-col gap-6">
          {/* Tagline */}
          <div className="text-center mb-4">
            {slogans.length > 0 ? (
              <p className="text-2xl md:text-3xl font-medium text-gray-900">
                {slogans[currentSloganIndex]}
              </p>
            ) : (
              <p className="text-2xl md:text-3xl font-medium text-gray-900">
                The more languages you learn, the easier it becomes
              </p>
            )}
          </div>

          {/* Hero picture from settings */}
          {heroImage && (
            <div className="flex justify-center mb-6">
              <img
                src={heroImage}
                alt="Hero"
                className="max-w-4xl w-full max-h-[360px] object-contain"
              />
            </div>
          )}

          {/* Testimonials */}
          {testimonials.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-5xl mx-auto max-h-[320px] overflow-auto">
              {testimonials.map((testimonial) => (
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
        <div className="fixed bottom-20 right-6 z-30">
          <button
            onClick={() => {
              if (user) {
                navigate('/topics');
              } else {
                setLoginModalOpen(true);
              }
            }}
            className="w-28 h-28 rounded-full bg-gradient-to-br from-cyan-300 to-sky-500 text-white font-semibold shadow-xl border border-white/50 hover:scale-105 active:scale-95 transition transform flex items-center justify-center text-center text-sm"
          >
            Let&apos;s study!
          </button>
        </div>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 text-center py-4 text-sm text-gray-700 bg-white bg-opacity-60">
          Copyright @ 2025 Goozi
        </footer>
      </div>

      {/* User Menu */}
      {userMenuOpen && (
        <UserMenu onClose={() => setUserMenuOpen(false)} />
      )}

      {/* Login Modal */}
      <LoginModal 
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => {
          // Refresh page or update state after successful login
          window.location.reload();
        }}
      />
    </div>
  );
}
