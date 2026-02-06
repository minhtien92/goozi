import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useAuthStore } from '../store/authStore';
import { getTranslation } from '../utils/translations';

interface VocabularyTranslation {
  id: string;
  languageId: string;
  meaning: string;
  pronunciation: string | null;
  example: string | null;
  audioUrl: string | null;
  version: number;
  language?: Language;
}

interface Vocabulary {
  id: string;
  word: string;
  avatar: string | null;
  order: number | null;
  translations?: VocabularyTranslation[];
}

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
  vocabularies: Vocabulary[];
  sourceLanguage?: Language;
  targetLanguage?: Language;
  translations?: TopicTranslation[];
}

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const translations = getTranslation(user?.nativeLanguage?.code);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [currentVocabIndex, setCurrentVocabIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  // Get voice accent version from user preference (default to 1)
  const voiceAccentVersion = user?.voiceAccentVersion || 1;

  useEffect(() => {
    if (id) {
      fetchTopic();
      setCurrentPage(1); // Reset to first page when topic changes
      setCurrentVocabIndex(0); // Reset vocab index
    }
  }, [id]);

  const fetchTopic = async () => {
    try {
      const response = await api.get(`/topics/${id}`);
      console.log('Topic detail response:', response.data); // Debug log
      const topicData = response.data.topic;
      if (topicData && topicData.vocabularies) {
        console.log('Vocabularies count:', topicData.vocabularies.length); // Debug log
      }
      setTopic(topicData);
    } catch (error) {
      console.error('Error fetching topic:', error);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (() => {
    let currentAudio: HTMLAudioElement | null = null;
    return (audioUrl: string | null, word: string) => {
      if (audioUrl) {
        // Normalize audio URL - ensure it's a full URL
        let normalizedUrl = audioUrl;
        if (!audioUrl.startsWith('http')) {
          // If it's a relative path, prepend the API base URL
          // Only remove /api at the end of URL, not in the middle (e.g., api.goozi.org)
          const viteApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
          const baseUrl = viteApiUrl.endsWith('/api') ? viteApiUrl.slice(0, -4) : viteApiUrl.replace(/\/api$/, '') || 'http://localhost:3001';
          normalizedUrl = `${baseUrl}${audioUrl.startsWith('/') ? audioUrl : '/' + audioUrl}`;
        }
        
        if (currentAudio) {
          // If same source is playing, toggle stop
          if (!currentAudio.paused && currentAudio.src === normalizedUrl) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
            return;
          } else {
            currentAudio.pause();
            currentAudio.currentTime = 0;
          }
        }
        const audio = new Audio(normalizedUrl);
        currentAudio = audio;
        audio.play().catch((err) => {
          console.error('Error playing audio:', err);
          console.error('Audio URL:', normalizedUrl);
        });
        audio.onended = () => {
          currentAudio = null;
        };
      } else if (word) {
        // fallback TTS
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    };
  })();
  
  // Helper function to get translation with preferred voice accent version
  const getTranslationWithVoiceAccent = (translations: VocabularyTranslation[] | undefined, languageId?: string) => {
    if (!translations || translations.length === 0) return null;
    
    // First try to find translation with preferred voice accent version
    let translation = translations.find(
      (t) => t.version === voiceAccentVersion && (!languageId || t.languageId === languageId)
    );
    
    // If not found, try to find any translation with preferred version (ignore language)
    if (!translation) {
      translation = translations.find((t) => t.version === voiceAccentVersion);
    }
    
    // If still not found, try to find translation matching language
    if (!translation && languageId) {
      translation = translations.find((t) => t.languageId === languageId);
    }
    
    // Fallback to first translation
    return translation || translations[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(to bottom, #11BBDD, #F2F4F6)' }}>
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!topic || !topic.vocabularies || topic.vocabularies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(to bottom, #11BBDD, #F2F4F6)' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <p className="text-xl mb-4 text-gray-800">{translations.noVocabularyFound}</p>
          <button
            onClick={() => navigate('/topics')}
            className="px-6 py-3 bg-blue-400 text-white rounded-lg font-medium hover:bg-blue-500"
          >
            {translations.back}
          </button>
        </div>
      </div>
    );
  }

  // Filter vocabularies that have at least one translation
  const vocabulariesWithTranslations = (topic.vocabularies || []).filter(
    (vocab) => {
      const hasTranslations = vocab.translations && vocab.translations.length > 0;
      if (!hasTranslations) {
        console.log(`TopicDetail - Vocabulary ${vocab.word} has no translations:`, vocab);
      }
      return hasTranslations;
    }
  );
  
  console.log('TopicDetail - Total vocabularies:', (topic.vocabularies || []).length);
  console.log('TopicDetail - Vocabularies with translations:', vocabulariesWithTranslations.length);

  // If no vocabularies with translations, show message
  if (vocabulariesWithTranslations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(to bottom, #11BBDD, #F2F4F6)' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <p className="text-xl mb-4 text-gray-800">{translations.noVocabularyToLearn}</p>
          <p className="text-sm text-gray-600 mb-6">
            Vui lòng thêm từ vựng và bản dịch cho chủ đề này trước khi học với flashcard.
          </p>
          <button
            onClick={() => navigate('/topics')}
            className="px-6 py-3 bg-blue-400 text-white rounded-lg font-medium hover:bg-blue-500"
          >
            {translations.backToList}
          </button>
        </div>
      </div>
    );
  }

  // Adjust currentVocabIndex if it's out of bounds
  const validIndex = Math.min(currentVocabIndex, vocabulariesWithTranslations.length - 1);
  if (validIndex !== currentVocabIndex) {
    setCurrentVocabIndex(validIndex);
  }

  const handleClose = () => {
    navigate('/');
  };

  // Helper function to get topic name translation based on mother tongue
  const getTopicName = (topic: Topic | null): string => {
    if (!topic) {
      return `Name of topic ${id}`;
    }
    const nativeLanguageId = user?.nativeLanguage?.id;
    if (!nativeLanguageId || !topic.translations || topic.translations.length === 0) {
      return topic.name;
    }
    const translation = topic.translations.find(
      (t) => t.languageId === nativeLanguageId
    );
    return translation?.meaning || topic.name;
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl h-[80vh] overflow-hidden relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 2xl:p-10 border-b border-gray-200">
          <button
            onClick={() => navigate('/topics')}
            className="text-gray-600 hover:text-gray-800"
            title={translations.backToList}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-2xl 2xl:text-3xl font-bold text-gray-800">
            {getTopicName(topic)}
          </h2>
          <div className="flex items-center gap-3">
            {/* (Optional) Search icon - keep for future */}
            {/* <button className="text-gray-600 hover:text-gray-800">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button> */}
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-3xl leading-none px-2"
              title={translations.close}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-8 2xl:p-10">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
            {vocabulariesWithTranslations
              .slice((currentPage - 1) * 15, currentPage * 15)
              .slice(0, 15) // Ensure max 15 items per page
              .map((vocab, index) => {
                // Calculate the actual index in the full array
                const actualIndex = (currentPage - 1) * 15 + index;
                // Get translation with preferred voice accent version for this vocabulary
                const vocabTranslation = getTranslationWithVoiceAccent(vocab.translations, topic.sourceLanguage?.id);
                return (
                  <div
                    key={vocab.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/topics/${id}/flashcard?index=${actualIndex}`);
                    }}
                    className={`bg-gray-100 border-2 rounded-lg p-6 hover:bg-blue-50 transition cursor-pointer ${
                      currentVocabIndex === actualIndex ? 'border-blue-500 bg-blue-50' : 'border-blue-300'
                    }`}
                  >
                    <div className="w-full h-32 bg-gray-300 rounded mb-4 flex items-center justify-center text-sm text-gray-500 relative">
                      {vocab.avatar && !imageErrors.has(vocab.id) ? (
                        <img 
                          src={vocab.avatar.startsWith('http') ? vocab.avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${vocab.avatar}`} 
                          alt={vocab.word} 
                          className="w-full h-full object-cover rounded" 
                          onError={() => {
                            setImageErrors(prev => new Set(prev).add(vocab.id));
                          }}
                        />
                      ) : (
                        <span>Avatar</span>
                      )}
                      {/* Audio button overlay */}
                      {vocabTranslation?.audioUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playAudio(vocabTranslation.audioUrl, vocab.word);
                          }}
                          className="absolute bottom-3 right-3 w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 shadow-md z-10"
                          title="Phát âm"
                        >
                          <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="text-base font-medium text-gray-800 text-center">
                      {vocab.word || `Name of word ${actualIndex + 1}`}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-3 p-8 border-t border-gray-200">
          {Array.from({ length: Math.ceil(vocabulariesWithTranslations.length / 15) }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-12 h-12 rounded-full text-lg font-medium ${
                currentPage === page
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } transition`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
