import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useAuthStore } from '../store/authStore';
import { getTranslation } from '../utils/translations';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface TopicTranslation {
  id: string;
  languageId: string;
  meaning: string;
  language?: Language;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  image: string | null;
  vocabularyCount: number;
  sourceLanguage?: Language;
  targetLanguage?: Language;
  translations?: TopicTranslation[];
}

export default function Topics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSourceLang, setSelectedSourceLang] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const translations = getTranslation(user?.nativeLanguage?.code);

  useEffect(() => {
    fetchLanguages();
    fetchTopics();
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [selectedSourceLang]);

  const fetchLanguages = async () => {
    try {
      await api.get('/languages?isActive=true');
      if (user?.nativeLanguage?.id) {
        setSelectedSourceLang(user.nativeLanguage.id);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      setLoading(true);
      let url = '/topics?isActive=true&limit=100';
      if (selectedSourceLang) {
        url += `&sourceLanguageId=${selectedSourceLang}`;
      }
      const response = await api.get(url);
      console.log('Topics response:', response.data); // Debug log
      setTopics(response.data.topics || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper: tên chủ đề theo mother tongue (dùng cho hiển thị và tìm kiếm)
  const getTopicName = (topic: Topic): string => {
    const nativeLanguageId = user?.nativeLanguage?.id;
    if (!nativeLanguageId || !topic.translations || topic.translations.length === 0) {
      return topic.name;
    }
    const translation = topic.translations.find(
      (t) => t.languageId === nativeLanguageId
    );
    return translation?.meaning || topic.name;
  };

  const filteredTopics = topics.filter((topic) =>
    getTopicName(topic).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTopicClick = (topicId: string) => {
    navigate(`/topics/${topicId}`);
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl 3xl:max-w-7xl h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <button
              onClick={handleClose}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-3xl font-bold text-teal-600">{translations.vocabulary}</h2>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder={translations.searchTopics}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-6 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button className="text-gray-600 hover:text-gray-800">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
              {filteredTopics.map((topic, index) => {
                // Chuẩn hoá URL ảnh topic (tương tự heroImage / avatar)
                const viteApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                const baseUrl = viteApiUrl.endsWith('/api')
                  ? viteApiUrl.slice(0, -4)
                  : viteApiUrl.replace(/\/api$/, '') || 'http://localhost:3001';
                const imageUrl =
                  topic.image && topic.image.startsWith('http')
                    ? topic.image
                    : topic.image
                    ? `${baseUrl}${topic.image}`
                    : null;

                return (
                  <div
                    key={topic.id}
                    onClick={() => handleTopicClick(topic.id)}
                    className="bg-gray-100 border-2 border-blue-300 rounded-lg p-6 cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition"
                  >
                    <div className="w-full h-32 bg-gray-300 rounded mb-4 flex items-center justify-center text-sm text-gray-500 overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={getTopicName(topic)}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            // Nếu ảnh lỗi thì quay lại text Avatar
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        'Avatar'
                      )}
                    </div>
                    <div className="text-base font-medium text-gray-800 text-center">
                      {getTopicName(topic) || `Name of topic ${index + 1}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
