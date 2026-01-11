import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface UserMenuProps {
  onClose?: () => void;
}

export default function UserMenu({ onClose }: UserMenuProps) {
  const { user, logout, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showMotherTongue, setShowMotherTongue] = useState(false);
  const [showVoiceAccent, setShowVoiceAccent] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [voiceAccents, setVoiceAccents] = useState<string[]>(['Voice accent 1', 'Voice accent 2', 'Voice accent 3', 'Voice accent 4']);
  const [selectedVoiceAccent, setSelectedVoiceAccent] = useState<string>('Voice accent 2');
  const [activeMenuItemTop, setActiveMenuItemTop] = useState<number>(0);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);
  const motherTongueButtonRef = useRef<HTMLButtonElement>(null);
  const voiceAccentButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const response = await api.get('/languages?isActive=true');
      setLanguages(response.data.languages);
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onClose) onClose();
  };

  const handleUpdateNativeLanguage = async (languageId: string) => {
    if (!user?.id) return;
    
    try {
      const response = await api.put(`/users/${user.id}`, {
        nativeLanguageId: languageId,
      });
      if (response.data.user) {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          const token = parsed?.state?.token;
          if (token) {
            setAuth(response.data.user, token);
          }
        }
      }
      setShowMotherTongue(false);
    } catch (error: any) {
      console.error('Error updating native language:', error);
      alert('Failed to update native language');
    }
  };

  const handleLanguageToggle = (languageId: string) => {
    setSelectedLanguages(prev => 
      prev.includes(languageId) 
        ? prev.filter(id => id !== languageId)
        : [...prev, languageId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-4 pr-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onClick={onClose}
      />
      
      {/* Menu Container - flex để menu và submenu nằm cạnh nhau */}
      <div className="relative z-50 flex gap-2 items-start flex-row-reverse">
        {/* Main Menu */}
        <div className="bg-white rounded-lg shadow-xl w-80 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                {user?.nativeLanguage?.flag || '🇰🇷'}
              </div>
              <span className="font-medium text-gray-800">{user?.name || 'Angelyna'}</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              ref={profileButtonRef}
              onClick={(e) => {
                const button = e.currentTarget;
                const rect = button.getBoundingClientRect();
                const menuRect = button.closest('.bg-white')?.getBoundingClientRect();
                if (menuRect) {
                  setActiveMenuItemTop(rect.top - menuRect.top);
                }
                setShowProfile(true);
                setShowLanguageSelector(false);
                setShowMotherTongue(false);
                setShowVoiceAccent(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition text-left ${showProfile ? 'bg-gray-100' : ''}`}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-gray-700">Your profile</span>
            </button>

            <button
              ref={languageButtonRef}
              onClick={(e) => {
                const button = e.currentTarget;
                const rect = button.getBoundingClientRect();
                const menuRect = button.closest('.bg-white')?.getBoundingClientRect();
                if (menuRect) {
                  setActiveMenuItemTop(rect.top - menuRect.top);
                }
                setShowLanguageSelector(true);
                setShowProfile(false);
                setShowMotherTongue(false);
                setShowVoiceAccent(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition text-left ${showLanguageSelector ? 'bg-gray-100' : ''}`}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">Choose language</span>
            </button>

            <button
              ref={motherTongueButtonRef}
              onClick={(e) => {
                const button = e.currentTarget;
                const rect = button.getBoundingClientRect();
                const menuRect = button.closest('.bg-white')?.getBoundingClientRect();
                if (menuRect) {
                  setActiveMenuItemTop(rect.top - menuRect.top);
                }
                setShowMotherTongue(true);
                setShowProfile(false);
                setShowLanguageSelector(false);
                setShowVoiceAccent(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition text-left ${showMotherTongue ? 'bg-gray-100' : ''}`}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-gray-700">Mother tongue</span>
            </button>

            <button
              ref={voiceAccentButtonRef}
              onClick={(e) => {
                const button = e.currentTarget;
                const rect = button.getBoundingClientRect();
                const menuRect = button.closest('.bg-white')?.getBoundingClientRect();
                if (menuRect) {
                  setActiveMenuItemTop(rect.top - menuRect.top);
                }
                setShowVoiceAccent(true);
                setShowProfile(false);
                setShowLanguageSelector(false);
                setShowMotherTongue(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition text-left ${showVoiceAccent ? 'bg-gray-100' : ''}`}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span className="text-gray-700">Voice accent</span>
            </button>
          </div>

          {/* Log out button */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Submenu Container - hiển thị bên trái menu chính */}
        {(showProfile || showLanguageSelector || showMotherTongue || showVoiceAccent) && (
          <div 
            className="bg-white rounded-lg shadow-xl w-80 flex flex-col max-h-[85vh]"
            style={{ marginTop: `${activeMenuItemTop}px` }}
          >
            {/* Profile Modal */}
            {showProfile && (
              <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Your profile</h3>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-4xl mb-3">
                  {user?.nativeLanguage?.flag || '🇰🇷'}
                </div>
                <h4 className="text-lg font-semibold text-blue-600">{user?.name || 'Angelyna'}</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    defaultValue={user?.name || ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              </div>
              </div>
            )}

            {/* Choose Language Modal */}
            {showLanguageSelector && (
              <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Choose language</h3>
              <button
                onClick={() => setShowLanguageSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-4 flex flex-col flex-1 overflow-hidden">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              />
              <div className="space-y-2 overflow-y-auto flex-1">
                {languages.map((lang) => (
                  <label
                    key={lang.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes(lang.id)}
                      onChange={() => handleLanguageToggle(lang.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-gray-700">{lang.nativeName}</span>
                  </label>
                ))}
              </div>
              </div>
              </div>
            )}

            {/* Mother Tongue Modal */}
            {showMotherTongue && (
              <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Mother tongue</h3>
              <button
                onClick={() => setShowMotherTongue(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleUpdateNativeLanguage(lang.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition ${
                      user?.nativeLanguage?.id === lang.id ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-800">{lang.nativeName}</div>
                      <div className="text-xs text-gray-500">{lang.name}</div>
                    </div>
                    {user?.nativeLanguage?.id === lang.id && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              </div>
              </div>
            )}

            {/* Voice Accent Modal */}
            {showVoiceAccent && (
              <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800">Voice accent</h3>
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <button
                onClick={() => setShowVoiceAccent(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                {voiceAccents.map((accent, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="voiceAccent"
                      value={accent}
                      checked={selectedVoiceAccent === accent}
                      onChange={(e) => setSelectedVoiceAccent(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">{accent}</span>
                  </label>
                ))}
              </div>
              </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

