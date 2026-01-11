import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LanguageSelector from '../components/LanguageSelector';
import UserMenu from '../components/UserMenu';
import api from '../config/api';

const greetings = [
  { text: 'Salut!', color: 'bg-orange-400', lang: 'French' },
  { text: 'Hi!', color: 'bg-amber-800', lang: 'English' },
  { text: 'Hallo!', color: 'bg-orange-400', lang: 'German' },
  { text: 'Hello!', color: 'bg-amber-800', lang: 'English' },
  { text: 'नमस्ते', color: 'bg-red-500', lang: 'Hindi' },
  { text: 'Bonjour!', color: 'bg-orange-400', lang: 'French' },
  { text: 'Olá!', color: 'bg-red-500', lang: 'Portuguese' },
  { text: 'Ciao!', color: 'bg-amber-800', lang: 'Italian' },
  { text: '你好', color: 'bg-red-500', lang: 'Chinese' },
  { text: 'مرحبا', color: 'bg-orange-400', lang: 'Arabic' },
];

export default function Home() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [slogans, setSlogans] = useState<string[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
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

      // Get background image - check both 'background_image' and 'picture' keys
      // Priority: background_image > picture (latest by order)
      let bgSetting = settings.find((s: any) => s.key === 'background_image');
      
      // If no background_image, get the latest picture
      if (!bgSetting) {
        const pictureSettings = settings.filter((s: any) => s.key === 'picture');
        if (pictureSettings.length > 0) {
          // Sort by order descending to get the latest
          pictureSettings.sort((a: any, b: any) => (b.order || 0) - (a.order || 0));
          bgSetting = pictureSettings[0];
        }
      }
      
      if (bgSetting && bgSetting.value) {
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
        const bgUrl = bgSetting.value.startsWith('http') ? bgSetting.value : `${baseUrl}${bgSetting.value}`;
        setBackgroundImage(bgUrl);
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

  const backgroundStyle = backgroundImage
    ? {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {
        background: 'linear-gradient(to right, #60a5fa, #4fd1c7, #e5e7eb)',
      };

  return (
    <div className="min-h-screen relative overflow-hidden" style={backgroundStyle}>
      {backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      )}
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
            <Link
              to="/topics"
              className="block text-gray-700 hover:text-blue-600 font-medium"
              onClick={() => setSidebarOpen(false)}
            >
              Vocabulary
            </Link>
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
        <header className="flex justify-between items-center p-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`${backgroundImage ? 'text-white drop-shadow-lg' : 'text-white'} hover:text-gray-200`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xl">G</span>
            </div>
            <h1 className={`text-4xl font-bold tracking-wider ${backgroundImage ? 'text-white drop-shadow-lg' : 'text-white'}`}>GOOZI</h1>
          </div>
          <div className={`flex items-center gap-4 ${backgroundImage ? 'text-white drop-shadow-lg' : 'text-white'}`}>
            <LanguageSelector />
            <button
              onClick={() => setUserMenuOpen(true)}
              className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-2xl">
                {user?.nativeLanguage?.flag || '🇰🇷'}
              </div>
              <span>{user?.name || 'Angelyna'}</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="px-6 pb-20">
          {/* Tagline */}
          <div className="text-center mb-12">
            {slogans.length > 0 ? (
              <div className="bg-red-500 text-white px-6 py-3 rounded-lg inline-block shadow-lg">
                <p className="text-2xl md:text-3xl font-medium">
                  {slogans[currentSloganIndex]}
                </p>
              </div>
            ) : (
              <p className={`text-2xl md:text-3xl font-medium ${backgroundImage ? 'text-white drop-shadow-lg' : 'text-gray-800'}`}>
                The more languages you learn, the easier it becomes
              </p>
            )}
          </div>

          {/* Greetings with Characters */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            {greetings.map((greeting, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`${greeting.color} rounded-full px-4 py-2 mb-2 text-white font-semibold text-lg shadow-lg`}
                >
                  {greeting.text}
                </div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-300 to-purple-300 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          {testimonials.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
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

        {/* Navigation Buttons (Right Side) */}
        <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-20 space-y-3">
          <Link
            to="/topics"
            className="block w-32 bg-blue-400 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-lg shadow-lg transition text-center"
          >
            Vocabulary
          </Link>
          <button className="block w-32 bg-blue-400 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-lg shadow-lg transition">
            Phrase
          </button>
          <button className="block w-32 bg-blue-400 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-lg shadow-lg transition">
            Sentence
          </button>
        </div>

        {/* Footer */}
        <footer className={`fixed bottom-0 left-0 right-0 text-center py-4 text-sm ${backgroundImage ? 'text-white bg-black bg-opacity-50' : 'text-gray-600 bg-white bg-opacity-50'}`}>
          Copyright @ 2025 Goozi
        </footer>
      </div>

      {/* User Menu */}
      {userMenuOpen && (
        <UserMenu onClose={() => setUserMenuOpen(false)} />
      )}
    </div>
  );
}
