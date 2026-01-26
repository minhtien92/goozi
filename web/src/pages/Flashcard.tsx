import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../config/api';
import { useAuthStore } from '../store/authStore';

interface VocabularyTranslation {
  id: string;
  languageId: string;
  meaning: string;
  pronunciation: string | null;
  ipa?: string | null;
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

  const speakWord = (translation: VocabularyTranslation | null, text: string, langCode?: string, key?: string) => {
    playAudio(translation?.audioUrl || null, text, langCode, key);
  };

  console.log('Flashcard: Rendering flashcard UI with', vocabularies.length, 'vocabularies');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[80vh] relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => navigate(`/topics/${id}`)}
            className="text-gray-600 hover:text-gray-800"
            title="Quay lại"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-2xl font-semibold text-gray-800">
              {currentVocab.word || `Name of word ${currentIndex + 1}`}
            </h2>
            <p className="text-lg text-gray-600 mt-2">
              {currentIndex + 1} / {vocabularies.length}
            </p>
          </div>
          <div className="flex items-center gap-3">
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
              className="w-12 h-12 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-sm"
              title="Phát âm"
            >
              {playingKey === 'header-source' ||
              (playingKey && playingKey.startsWith('header-')) ? (
                // Stop icon (red) - giống CMS (fa-stop)
                <svg className="w-6 h-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H6z" />
                </svg>
              ) : (
                // Play icon (green) - giống CMS (fa-play)
                <svg className="w-6 h-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 4.5v11l9-5.5-9-5.5z" />
                </svg>
              )}
            </button>
            <button className="w-12 h-12 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-sm" title="Refresh">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Avatar Section */}
        <div className="p-8 flex items-center justify-center gap-6">
          {/* Left Arrow */}
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Image Container */}
          <div className="bg-gray-200 w-full max-w-lg h-96 flex items-center justify-center rounded-lg flex-shrink">
            {currentVocab.avatar && !imageError ? (
              <img 
                src={currentVocab.avatar.startsWith('http') ? currentVocab.avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${currentVocab.avatar}`} 
                alt={currentVocab.word} 
                className="w-full h-full object-cover rounded-lg" 
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="text-gray-500 text-base">Avatar</div>
            )}
          </div>
          
          {/* Right Arrow */}
          <button
            onClick={handleNext}
            disabled={currentIndex >= vocabularies.length - 1}
            className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Translations */}
        <div className="p-8 space-y-4 flex-1 overflow-y-auto">
          {/* Display source language translation (English) first */}
          {sourceTranslation && sourceLang && (
            <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-lg">
              {sourceLang.flag && sourceLang.flag.startsWith('http') ? (
                <img src={sourceLang.flag} alt={sourceLang.name} className="w-16 h-12 object-cover rounded" />
              ) : (
                <span className="text-5xl">{sourceLang.flag || '🌐'}</span>
              )}
              <div className="flex-1 text-center">
                <div className="font-semibold text-2xl text-gray-800">
                  {currentVocab.word}
                </div>
                {(sourceTranslation.ipa || sourceTranslation.pronunciation) && (
                  <div className="text-xl text-gray-600 italic mt-2">
                    /{sourceTranslation.ipa || sourceTranslation.pronunciation}/
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => speakWord(
                    sourceTranslation,
                    currentVocab.word,
                    sourceLang.code || 'en-US',
                    `source-${sourceLang.id}`
                  )}
                  className="w-12 h-12 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-sm"
                  title="Phát âm"
                >
                  {playingKey === `source-${sourceLang.id}` ? (
                    <svg className="w-6 h-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H6z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6 4.5v11l9-5.5-9-5.5z" />
                    </svg>
                  )}
                </button>
                <button className="w-12 h-12 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-sm" title="Person">
                  <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Display translations for learning languages - limit to 2 (total 3 with source) */}
          {learningLanguageTranslations.slice(0, 2).map((item) => {
            if (!item.language || !item.translation) return null;
            const key = `row-${item.language.id}-${item.translation.id}`;
            
            return (
              <div
                key={key}
                className="flex items-center gap-6 p-6 bg-gray-50 rounded-lg"
              >
                {item.language.flag && item.language.flag.startsWith('http') ? (
                  <img src={item.language.flag} alt={item.language.name} className="w-16 h-12 object-cover rounded" />
                ) : (
                  <span className="text-5xl">{item.language.flag || '🌐'}</span>
                )}
                <div className="flex-1 text-center">
                  <div className="font-semibold text-2xl text-gray-800">
                    {item.translation.meaning || currentVocab.word}
                  </div>
                  {(item.translation.ipa || item.translation.pronunciation) && (
                    <div className="text-xl text-gray-600 italic mt-2">
                      /{item.translation.ipa || item.translation.pronunciation}/
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => speakWord(
                      item.translation,
                      item.translation.meaning || currentVocab.word,
                      item.language.code || 'en-US',
                      key
                    )}
                    className="w-12 h-12 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-sm"
                    title="Phát âm"
                  >
                    {playingKey === key ? (
                      // Stop icon (red) - giống CMS
                      <svg className="w-6 h-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H6z" />
                      </svg>
                    ) : (
                      // Play icon (green) - giống CMS
                      <svg className="w-6 h-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 4.5v11l9-5.5-9-5.5z" />
                      </svg>
                    )}
                  </button>
                  <button className="w-12 h-12 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-sm" title="Person">
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
          
          {/* Locked content row - show if there are more than 2 learning languages */}
          {learningLanguageTranslations.length > 2 && (() => {
            const lockedItem = learningLanguageTranslations[2];
            if (!lockedItem || !lockedItem.language || !lockedItem.translation) return null;
            
            return (
              <div className="relative">
                {/* Background language card (blurred/disabled) */}
                <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-lg opacity-50">
                  {lockedItem.language.flag && lockedItem.language.flag.startsWith('http') ? (
                    <img src={lockedItem.language.flag} alt={lockedItem.language.name} className="w-16 h-12 object-cover rounded" />
                  ) : (
                    <span className="text-5xl">{lockedItem.language.flag || '🌐'}</span>
                  )}
                  <div className="flex-1 text-center">
                    <div className="font-semibold text-2xl text-gray-800">
                      {lockedItem.translation.meaning || currentVocab.word}
                    </div>
                    {(lockedItem.translation.ipa || lockedItem.translation.pronunciation) && (
                      <div className="text-xl text-gray-600 italic mt-2">
                        /{lockedItem.translation.ipa || lockedItem.translation.pronunciation}/
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <div className="w-12 h-12"></div>
                    <div className="w-12 h-12"></div>
                  </div>
                </div>
                {/* Overlay with Unlock button in center */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 rounded-lg">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition">
                    Unlock
                  </button>
                </div>
              </div>
            );
          })()}
          
          {/* Fallback if no learning languages selected */}
          {learningLanguageTranslations.length === 0 && !sourceTranslation && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Vui lòng chọn ngôn ngữ học trong profile để xem bản dịch</p>
            </div>
          )}
        </div>

        {/* Bottom Ad Banner */}
        <div className="bg-lime-400 text-center py-2 text-sm font-medium">
          ADS - BOTTOM
        </div>
      </div>
    </div>
  );
}

