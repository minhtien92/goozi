import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../config/api';
import { useAuthStore } from '../store/authStore';

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

interface Topic {
  id: string;
  name: string;
  vocabularies: Vocabulary[];
  sourceLanguage?: Language;
  targetLanguage?: Language;
}

export default function Flashcard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  // Get initial index from URL params, default to 0
  const initialIndex = parseInt(searchParams.get('index') || '0', 10);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  
  // Use refs to persist audio state across renders
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentKeyRef = useRef<string | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Get voice accent version from user preference (default to 1)
  const voiceAccentVersion = user?.voiceAccentVersion || 1;

  console.log('Flashcard component rendered, id:', id);

  useEffect(() => {
    console.log('Flashcard useEffect triggered, id:', id);
    if (id) {
      fetchVocabularies();
      fetchLanguages();
    } else {
      console.error('Flashcard: No topic ID provided');
      setLoading(false);
    }
  }, [id]);
  
  const fetchLanguages = async () => {
    try {
      const response = await api.get('/languages?isActive=true');
      setLanguages(response.data.languages);
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const fetchVocabularies = async () => {
    try {
      const response = await api.get(`/topics/${id}`);
      const topicData = response.data.topic;
      console.log('Flashcard - Topic data:', topicData);
      console.log('Flashcard - Vocabularies:', topicData.vocabularies);
      
      setTopic(topicData);
      
      // Get all vocabularies (we'll handle missing translations in the UI)
      const allVocabularies = topicData.vocabularies || [];
      
      // Filter vocabularies that have at least one translation for better UX
      // But we'll still show vocabularies without translations with a message
      const vocabulariesWithTranslations = allVocabularies.filter(
        (vocab: Vocabulary) => {
          const hasTranslations = vocab.translations && vocab.translations.length > 0;
          console.log(`Flashcard - Vocabulary ${vocab.word}: hasTranslations=${hasTranslations}`, vocab.translations);
          return hasTranslations;
        }
      );
      
      console.log('Flashcard - Total vocabularies:', allVocabularies.length);
      console.log('Flashcard - Vocabularies with translations:', vocabulariesWithTranslations.length);
      console.log('Flashcard - Filtered vocabularies:', vocabulariesWithTranslations);
      
      // Use vocabularies with translations, or fallback to all vocabularies if none have translations
      const vocabulariesToShow = vocabulariesWithTranslations.length > 0 
        ? vocabulariesWithTranslations 
        : allVocabularies;
      
      setVocabularies(vocabulariesToShow);
      
      // Set currentIndex based on URL param after vocabularies are loaded
      // The index from URL is from the filtered list in TopicDetail (vocabulariesWithTranslations)
      // We need to find the corresponding vocabulary in our filtered list
      const urlIndex = parseInt(searchParams.get('index') || '0', 10);
      
      if (urlIndex >= 0 && urlIndex < vocabulariesWithTranslations.length) {
        const targetVocabId = vocabulariesWithTranslations[urlIndex]?.id;
        // Find the index in our filtered list
        const foundIndex = vocabulariesToShow.findIndex((v: Vocabulary) => v.id === targetVocabId);
        if (foundIndex >= 0) {
          setCurrentIndex(foundIndex);
        } else if (vocabulariesToShow.length > 0) {
          // If not found, default to 0
          setCurrentIndex(0);
        }
      } else if (vocabulariesToShow.length > 0) {
        // If index is out of bounds, set to 0
        setCurrentIndex(0);
      }
      
      if (vocabulariesWithTranslations.length === 0 && allVocabularies.length > 0) {
        console.warn('No vocabularies with translations found, but showing vocabularies without translations');
        console.warn('All vocabularies:', allVocabularies);
      }
    } catch (error) {
      console.error('Error fetching vocabularies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to stop all audio - use useCallback to memoize
  const stopAllAudio = useCallback(() => {
    // Stop HTMLAudioElement
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    
    // Stop SpeechSynthesis
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    if (currentUtteranceRef.current) {
      currentUtteranceRef.current = null;
    }
    
    // Reset state
    currentKeyRef.current = null;
    setPlayingKey(null);
  }, []);
  
  // Cleanup on unmount and when card changes - MUST be before any early returns
  useEffect(() => {
    // Stop audio when card changes
    stopAllAudio();
    // Reset image error state when card changes
    setImageError(false);
    
    // Cleanup on unmount
    return () => {
      stopAllAudio();
    };
  }, [currentIndex, stopAllAudio]);

  const handleNext = () => {
    if (currentIndex < vocabularies.length - 1) {
      stopAllAudio();
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      stopAllAudio();
      setCurrentIndex(currentIndex - 1);
    }
  };

  const playAudio = (audioUrl: string | null, text: string, langCode?: string, key?: string) => {
    // Kiểm tra nếu đang phát cùng key -> toggle pause
    if (currentKeyRef.current && key && currentKeyRef.current === key) {
      // Nếu đang có audio đang phát
      if (currentAudioRef.current && !currentAudioRef.current.paused) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
        currentKeyRef.current = null;
        setPlayingKey(null);
        return;
      }
      
      // Nếu đang có SpeechSynthesis đang phát
      if (window.speechSynthesis.speaking && currentUtteranceRef.current) {
        window.speechSynthesis.cancel();
        currentUtteranceRef.current = null;
        currentKeyRef.current = null;
        setPlayingKey(null);
        return;
      }
    }
    
    // Nếu đang có audio khác, dừng nó trước
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    
    // Dừng SpeechSynthesis nếu đang phát
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    currentUtteranceRef.current = null;
    currentKeyRef.current = null;
    setPlayingKey(null);
    
    // Prefer audioUrl from translation if available
    if (audioUrl) {
      // Chuẩn hoá URL giống như ở TopicDetail
      let normalizedUrl = audioUrl;
      if (!audioUrl.startsWith('http')) {
        // Only remove /api at the end of URL, not in the middle (e.g., api.goozi.org)
        const viteApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const baseUrl = viteApiUrl.endsWith('/api') ? viteApiUrl.slice(0, -4) : viteApiUrl.replace(/\/api$/, '') || 'http://localhost:3001';
        normalizedUrl = `${baseUrl}${audioUrl.startsWith('/') ? audioUrl : '/' + audioUrl}`;
      }

      const audio = new Audio(normalizedUrl);
      currentAudioRef.current = audio;
      currentKeyRef.current = key || null;
      setPlayingKey(key || null);
      
      audio
        .play()
        .catch((err) => {
          console.error('Error playing audio:', err);
          console.error('Audio URL:', normalizedUrl);
          // Nếu lỗi thì reset trạng thái nút để không bị kẹt ở trạng thái pause
          currentAudioRef.current = null;
          currentKeyRef.current = null;
          setPlayingKey(null);
          // Fallback to TTS if audio fails
          if (text) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = langCode || 'en-US';
            currentUtteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
            
            utterance.onend = () => {
              currentUtteranceRef.current = null;
              setPlayingKey(null);
            };
          }
        });
      
      audio.onended = () => {
        currentAudioRef.current = null;
        currentKeyRef.current = null;
        setPlayingKey(null);
      };
      
      audio.onerror = () => {
        currentAudioRef.current = null;
        currentKeyRef.current = null;
        setPlayingKey(null);
      };
    } else if (text) {
      // Fallback to browser TTS if no audioUrl
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode || 'en-US';
      currentUtteranceRef.current = utterance;
      currentKeyRef.current = key || null;
      setPlayingKey(key || null);
      
      utterance.onend = () => {
        currentUtteranceRef.current = null;
        currentKeyRef.current = null;
        setPlayingKey(null);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Helper function to get translation with preferred voice accent version for a specific language
  const getTranslationWithVoiceAccent = (translations: VocabularyTranslation[] | undefined, languageId: string) => {
    if (!translations || translations.length === 0 || !languageId) return null;
    
    // First try to find translation with preferred voice accent version AND matching language
    let translation = translations.find(
      (t) => t.version === voiceAccentVersion && t.languageId === languageId
    );
    
    // If not found, try to find any translation for this language (any version)
    if (!translation) {
      translation = translations.find((t) => t.languageId === languageId);
    }
    
    // Return null if no translation found for this language (don't fallback to other languages)
    return translation || null;
  };

  const getSourceTranslation = (vocab: Vocabulary) => {
    if (!topic?.sourceLanguage?.id) return null;
    return getTranslationWithVoiceAccent(vocab.translations, topic.sourceLanguage.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  if (vocabularies.length === 0) {
    // Check if topic has vocabularies but no translations
    const hasVocabulariesWithoutTranslations = topic && topic.vocabularies && topic.vocabularies.length > 0;
    
    console.log('Flashcard: No vocabularies to show, hasVocabulariesWithoutTranslations:', hasVocabulariesWithoutTranslations);
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4 fixed inset-0 z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <p className="text-xl mb-4 text-gray-800">
            {hasVocabulariesWithoutTranslations 
              ? 'Chưa có bản dịch cho từ vựng' 
              : 'Chưa có từ vựng để học'}
          </p>
          <p className="text-sm text-gray-600 mb-6">
            {hasVocabulariesWithoutTranslations
              ? `Chủ đề này có ${topic.vocabularies.length} từ vựng nhưng chưa có bản dịch. Vui lòng thêm bản dịch cho từ vựng trước khi học với flashcard.`
              : 'Chủ đề này chưa có từ vựng với bản dịch. Vui lòng thêm từ vựng và bản dịch trước khi học với flashcard.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(`/topics/${id}`)}
              className="px-6 py-3 bg-gray-400 text-white rounded-lg font-medium hover:bg-gray-500"
            >
              Xem chi tiết
            </button>
            <button
              onClick={() => navigate('/topics')}
              className="px-6 py-3 bg-blue-400 text-white rounded-lg font-medium hover:bg-blue-500"
            >
              Chọn chủ đề khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentVocab = vocabularies[currentIndex];
  const sourceTranslation = getSourceTranslation(currentVocab);
  const sourceLang = topic?.sourceLanguage || sourceTranslation?.language;
  
  // Get learning languages from user profile
  const learningLanguageIds = user?.learningLanguageIds || [];
  const uniqueLearningLanguageIds = Array.from(new Set(learningLanguageIds));
  
  console.log('Flashcard - User learning languages:', uniqueLearningLanguageIds);
  console.log('Flashcard - Voice accent version:', voiceAccentVersion);
  console.log('Flashcard - Current vocab translations:', currentVocab?.translations?.map(t => ({
    languageId: t.languageId,
    language: t.language?.name,
    version: t.version,
    meaning: t.meaning
  })));
  
  // Get all translations for learning languages
  const getTranslationsForLearningLanguages = () => {
    if (!currentVocab.translations || uniqueLearningLanguageIds.length === 0) {
      console.log('Flashcard - No translations or no learning languages selected');
      return [];
    }
    
    const results = uniqueLearningLanguageIds.map(langId => {
      const translation = getTranslationWithVoiceAccent(currentVocab.translations, langId);
      if (!translation) {
        console.log(`Flashcard - No translation found for language ${langId} (voice accent version ${voiceAccentVersion})`);
        return null;
      }
      
      // Find language info from languages list or from translation
      const lang = languages.find(l => l.id === langId) || translation.language;
      if (!lang) {
        console.warn(`Flashcard - Language info not found for languageId: ${langId}`);
        return null;
      }
      
      console.log(`Flashcard - Found translation for ${lang.name}: version ${translation.version}, meaning: ${translation.meaning}`);
      return { translation, language: lang };
    }).filter(Boolean) as Array<{ translation: VocabularyTranslation; language: Language }>;
    
    console.log('Flashcard - Final learning language translations:', results.map(r => ({
      language: r.language.name,
      version: r.translation.version,
      meaning: r.translation.meaning
    })));
    
    return results;
  };
  
  const learningLanguageTranslations = getTranslationsForLearningLanguages();

  const handleClose = () => {
    stopAllAudio();
    navigate('/');
  };

  const speakWord = (translation: VocabularyTranslation | null, text: string, langCode?: string, key?: string) => {
    playAudio(translation?.audioUrl || null, text, langCode, key);
  };

  console.log('Flashcard: Rendering flashcard UI with', vocabularies.length, 'vocabularies');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => navigate(`/topics/${id}`)}
            className="text-gray-600 hover:text-gray-800"
            title="Quay lại"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {currentVocab.word || `Name of word ${currentIndex + 1}`}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const firstTranslation = learningLanguageTranslations[0];
                if (firstTranslation) {
                  speakWord(
                    firstTranslation.translation,
                    firstTranslation.translation.meaning || currentVocab.word,
                    firstTranslation.language?.code || 'en-US',
                    `header-${firstTranslation.language.id}`
                  );
                } else {
                  speakWord(
                    sourceTranslation,
                    currentVocab.word,
                    sourceLang?.code || 'en-US',
                    'header-source'
                  );
                }
              }}
              className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-sm"
              title="Phát âm"
            >
              {playingKey === 'header-source' ||
              (playingKey && playingKey.startsWith('header-')) ? (
                // Stop icon (red) - giống CMS (fa-stop)
                <svg className="w-4 h-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H6z" />
                </svg>
              ) : (
                // Play icon (green) - giống CMS (fa-play)
                <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 4.5v11l9-5.5-9-5.5z" />
                </svg>
              )}
            </button>
            <button className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-sm" title="Refresh">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-sm text-gray-600"
              title="Đóng"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="text-center py-2 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            {currentIndex + 1} / {vocabularies.length}
          </p>
        </div>

        {/* Avatar Section */}
        <div className="relative bg-gray-200 h-64 flex items-center justify-center">
          {currentVocab.avatar && !imageError ? (
            <img 
              src={currentVocab.avatar.startsWith('http') ? currentVocab.avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${currentVocab.avatar}`} 
              alt={currentVocab.word} 
              className="w-full h-full object-cover" 
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="text-gray-500 text-sm">Avatar</div>
          )}
          {/* Left Arrow */}
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="absolute left-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {/* Right Arrow */}
          <button
            onClick={handleNext}
            disabled={currentIndex >= vocabularies.length - 1}
            className="absolute right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Translations */}
        <div className="p-6 space-y-3 flex-1 overflow-y-auto">
          {/* Display translations for learning languages */}
          {learningLanguageTranslations.map((item) => {
            if (!item.language || !item.translation) return null;
            const key = `row-${item.language.id}-${item.translation.id}`;
            
            return (
              <div
                key={key}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <span className="text-2xl">{item.language.flag || '🌐'}</span>
                <div className="flex-1">
                  <div className="font-semibold text-base text-gray-800">
                    {item.translation.meaning || currentVocab.word}
                  </div>
                  {item.translation.pronunciation && (
                    <div className="text-sm text-gray-600 italic mt-1">
                      /{item.translation.pronunciation}/
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => speakWord(
                      item.translation,
                      item.translation.meaning || currentVocab.word,
                      item.language.code || 'en-US',
                      key
                    )}
                    className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-sm"
                    title="Phát âm"
                  >
                    {playingKey === key ? (
                      // Stop icon (red) - giống CMS
                      <svg className="w-4 h-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H6z" />
                      </svg>
                    ) : (
                      // Play icon (green) - giống CMS
                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 4.5v11l9-5.5-9-5.5z" />
                      </svg>
                    )}
                  </button>
                  <button className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-sm" title="Person">
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
          
          {/* Locked content row */}
          {learningLanguageTranslations.length > 0 && (
            <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg opacity-60">
              <div className="w-8 h-8 border-2 border-gray-300 rounded"></div>
              <div className="flex-1">
                <div className="font-semibold text-base text-gray-600">Unlock để xem thêm</div>
              </div>
              <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition">
                Unlock
              </button>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center opacity-50" title="Phát âm">
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                </button>
                <button className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center opacity-50" title="Person">
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Fallback if no learning languages selected */}
          {learningLanguageTranslations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Vui lòng chọn ngôn ngữ học trong profile để xem bản dịch</p>
            </div>
          )}
        </div>

        {/* Footer - Unlock Bar */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="w-6 h-6 border-2 border-gray-300 rounded"></div>
          <button className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-medium transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Unlock
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => speakWord(sourceTranslation, currentVocab.word, sourceLang?.code || 'en-US')}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
              title="Phát âm"
            >
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </button>
            <button className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center" title="Cài đặt">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom Ad Banner */}
        <div className="bg-lime-400 text-center py-2 text-sm font-medium">
          ADS - BOTTOM
        </div>
      </div>
    </div>
  );
}

