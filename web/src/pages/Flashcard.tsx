import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';

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
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState<Topic | null>(null);

  console.log('Flashcard component rendered, id:', id);

  useEffect(() => {
    console.log('Flashcard useEffect triggered, id:', id);
    if (id) {
      fetchVocabularies();
    } else {
      console.error('Flashcard: No topic ID provided');
      setLoading(false);
    }
  }, [id]);

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

  const handleNext = () => {
    if (currentIndex < vocabularies.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const playAudio = (() => {
    let currentAudio: HTMLAudioElement | null = null;
    return (text: string, langCode?: string) => {
      if (currentAudio) {
        if (!currentAudio.paused) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        currentAudio = null;
      }
      
      if (text) {
        // Use browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode || 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    };
  })();

  const getSourceTranslation = (vocab: Vocabulary) => {
    if (!vocab.translations || vocab.translations.length === 0) return null;
    
    // Try to find translation for source language
    if (topic?.sourceLanguage?.id) {
      const sourceTrans = vocab.translations.find(
        (t) => t.languageId === topic.sourceLanguage?.id
      );
      if (sourceTrans) return sourceTrans;
    }
    
    // Fallback to first translation
    return vocab.translations[0];
  };

  const getTargetTranslation = (vocab: Vocabulary) => {
    if (!vocab.translations || vocab.translations.length === 0) return null;
    
    // Try to find translation for target language
    if (topic?.targetLanguage?.id) {
      const targetTrans = vocab.translations.find(
        (t) => t.languageId === topic.targetLanguage?.id
      );
      if (targetTrans) return targetTrans;
    }
    
    // If we have source translation, try to get a different one
    const sourceTrans = getSourceTranslation(vocab);
    if (sourceTrans && vocab.translations.length > 1) {
      return vocab.translations.find(t => t.id !== sourceTrans.id) || vocab.translations[0];
    }
    
    // Fallback to first translation
    return vocab.translations[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-400 via-blue-300 to-gray-200 flex items-center justify-center">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  if (vocabularies.length === 0) {
    // Check if topic has vocabularies but no translations
    const hasVocabulariesWithoutTranslations = topic && topic.vocabularies && topic.vocabularies.length > 0;
    
    console.log('Flashcard: No vocabularies to show, hasVocabulariesWithoutTranslations:', hasVocabulariesWithoutTranslations);
    
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-400 via-blue-300 to-gray-200 flex items-center justify-center p-4 fixed inset-0 z-50">
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
  const targetTranslation = getTargetTranslation(currentVocab);
  const sourceLang = topic?.sourceLanguage || sourceTranslation?.language;
  const targetLang = topic?.targetLanguage || targetTranslation?.language;

  const handleClose = () => {
    navigate('/');
  };

  const speakWord = (text: string, langCode?: string) => {
    playAudio(text, langCode);
  };

  console.log('Flashcard: Rendering flashcard UI with', vocabularies.length, 'vocabularies');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
            <h2 className="text-xl font-bold text-gray-800">
              {currentVocab.word || `Name of word ${currentIndex + 1}`}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {currentIndex + 1} / {vocabularies.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => speakWord(currentVocab.word, sourceLang?.code || 'en-US')}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              title="Phát âm"
            >
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </button>
            <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center" title="Cài đặt">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Avatar Section */}
        <div className="relative bg-gray-200 h-64 flex items-center justify-center">
          {currentVocab.avatar ? (
            <img 
              src={currentVocab.avatar.startsWith('http') ? currentVocab.avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${currentVocab.avatar}`} 
              alt={currentVocab.word} 
              className="w-full h-full object-cover" 
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
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Source Language (English) */}
          {sourceLang && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-3xl">{sourceLang.flag || '🇬🇧'}</span>
              <div className="flex-1">
                <div className="font-semibold text-lg text-gray-800">{currentVocab.word}</div>
                {sourceTranslation?.pronunciation && (
                  <div className="text-sm text-gray-600 italic mt-1">{sourceTranslation.pronunciation}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => speakWord(currentVocab.word, sourceLang.code || 'en-US')}
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
          )}

          {/* Target Language */}
          {targetTranslation && targetLang && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-3xl">{targetLang.flag || '🌐'}</span>
              <div className="flex-1">
                <div className="font-semibold text-lg text-gray-800">{targetTranslation.meaning}</div>
                {targetTranslation.pronunciation && (
                  <div className="text-sm text-gray-600 italic mt-1">{targetTranslation.pronunciation}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => speakWord(targetTranslation.meaning, targetLang.code || 'en-US')}
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
              onClick={() => speakWord(currentVocab.word, sourceLang?.code || 'en-US')}
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

