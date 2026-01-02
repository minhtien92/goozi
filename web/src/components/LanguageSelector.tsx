import { useState, useEffect } from 'react';
import api from '../config/api';
import { useAuthStore } from '../store/authStore';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export default function LanguageSelector() {
  const { user, setAuth } = useAuthStore();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedSourceLang, setSelectedSourceLang] = useState<Language | null>(null);

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (user?.nativeLanguage && languages.length > 0) {
      const nativeLang = languages.find((l: Language) => l.id === user.nativeLanguage?.id);
      if (nativeLang) {
        setSelectedSourceLang(nativeLang);
      }
    }
  }, [user, languages]);

  const fetchLanguages = async () => {
    try {
      const response = await api.get('/languages?isActive=true');
      setLanguages(response.data.languages);
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const handleUpdateNativeLanguage = async (languageId: string) => {
    if (!user?.id) {
      alert('Vui lòng đăng nhập để thay đổi ngôn ngữ');
      return;
    }
    
    try {
      const response = await api.put(`/users/${user.id}`, {
        nativeLanguageId: languageId,
      });
      // Update auth store with new user data
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
      setShowSelector(false);
    } catch (error: any) {
      console.error('Error updating native language:', error);
      if (error.response?.status === 403) {
        alert('Bạn không có quyền cập nhật thông tin này');
      } else if (error.response?.status === 401) {
        alert('Vui lòng đăng nhập lại');
      } else {
        alert('Cập nhật ngôn ngữ thất bại: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowSelector(!showSelector)}
        className="flex items-center gap-2 text-white hover:text-gray-200 px-3 py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition"
        title="Thay đổi ngôn ngữ của bạn"
      >
        {selectedSourceLang ? (
          <>
            <span className="text-xl">{selectedSourceLang.flag}</span>
            <span className="text-sm font-medium">{selectedSourceLang.nativeName}</span>
          </>
        ) : user?.nativeLanguage ? (
          <>
            <span className="text-xl">{user.nativeLanguage.flag}</span>
            <span className="text-sm font-medium">{user.nativeLanguage.nativeName}</span>
          </>
        ) : (
          <>
            <span className="text-xl">🌐</span>
            <span className="text-sm">Chọn ngôn ngữ</span>
          </>
        )}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showSelector && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowSelector(false)}
          />
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl p-4 z-50 min-w-[250px]">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Ngôn ngữ của bạn</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {languages.map((lang: Language) => (
                <button
                  key={lang.id}
                  onClick={() => handleUpdateNativeLanguage(lang.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition ${
                    (selectedSourceLang?.id === lang.id || user?.nativeLanguage?.id === lang.id) ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-800">{lang.nativeName}</div>
                    <div className="text-xs text-gray-500">{lang.name}</div>
                  </div>
                  {(selectedSourceLang?.id === lang.id || user?.nativeLanguage?.id === lang.id) && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

