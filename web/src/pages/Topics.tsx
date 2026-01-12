import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useAuthStore } from '../store/authStore';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  image: string | null;
  vocabularyCount: number;
  sourceLanguage?: Language;
  targetLanguage?: Language;
}

export default function Topics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSourceLang, setSelectedSourceLang] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

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
      let url = '/topics?isActive=true';
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

  const filteredTopics = topics.filter((topic) =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTopics.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTopics = filteredTopics.slice(startIndex, startIndex + itemsPerPage);

  const handleTopicClick = (topicId: string) => {
    navigate(`/topics/${topicId}`);
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={handleClose}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-teal-600">Vocabulary</h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button className="text-gray-600 hover:text-gray-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {paginatedTopics.map((topic, index) => (
                <div
                  key={topic.id}
                  onClick={() => handleTopicClick(topic.id)}
                  className="bg-gray-100 border-2 border-blue-300 rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition"
                >
                  <div className="w-full h-24 bg-gray-300 rounded mb-3 flex items-center justify-center text-xs text-gray-500">
                    Avatar
                  </div>
                  <div className="text-sm font-medium text-gray-800 text-center">
                    {topic.name || `Name of topic ${startIndex + index + 1}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-6 border-t border-gray-200">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-full ${
                  currentPage === page
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
