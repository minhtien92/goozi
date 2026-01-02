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
  description: string;
  vocabularies: Vocabulary[];
  sourceLanguage?: Language;
  targetLanguage?: Language;
}

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [currentVocabIndex, setCurrentVocabIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTopic();
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

  const handlePrevious = () => {
    if (currentVocabIndex > 0) {
      setCurrentVocabIndex(currentVocabIndex - 1);
    }
  };

  const handleNext = () => {
    const vocabulariesWithTranslations = topic?.vocabularies.filter(
      (vocab) => vocab.translations && vocab.translations.length > 0
    ) || [];
    if (currentVocabIndex < vocabulariesWithTranslations.length - 1) {
      setCurrentVocabIndex(currentVocabIndex + 1);
    }
  };

  const playAudio = (audioUrl: string | null, word: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    } else if (word) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-400 via-blue-300 to-gray-200 flex items-center justify-center">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!topic || topic.vocabularies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-400 via-blue-300 to-gray-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <p className="text-xl mb-4 text-gray-800">Không tìm thấy từ vựng</p>
          <button
            onClick={() => navigate('/topics')}
            className="px-6 py-3 bg-blue-400 text-white rounded-lg font-medium hover:bg-blue-500"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Filter vocabularies that have at least one translation
  const vocabulariesWithTranslations = topic.vocabularies.filter(
    (vocab) => {
      const hasTranslations = vocab.translations && vocab.translations.length > 0;
      if (!hasTranslations) {
        console.log(`TopicDetail - Vocabulary ${vocab.word} has no translations:`, vocab);
      }
      return hasTranslations;
    }
  );
  
  console.log('TopicDetail - Total vocabularies:', topic.vocabularies.length);
  console.log('TopicDetail - Vocabularies with translations:', vocabulariesWithTranslations.length);

  // If no vocabularies with translations, show message
  if (vocabulariesWithTranslations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-400 via-blue-300 to-gray-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <p className="text-xl mb-4 text-gray-800">Chủ đề này chưa có từ vựng để học</p>
          <p className="text-sm text-gray-600 mb-6">
            Vui lòng thêm từ vựng và bản dịch cho chủ đề này trước khi học với flashcard.
          </p>
          <button
            onClick={() => navigate('/topics')}
            className="px-6 py-3 bg-blue-400 text-white rounded-lg font-medium hover:bg-blue-500"
          >
            Quay lại danh sách
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

  const currentVocab = vocabulariesWithTranslations[validIndex];
  const sourceLang = topic.sourceLanguage;
  const targetLang = topic.targetLanguage;

  // Get translations for source and target languages
  const sourceTranslation = currentVocab?.translations?.find(
    (t) => t.languageId === sourceLang?.id
  );
  const targetTranslation = currentVocab?.translations?.find(
    (t) => t.languageId === targetLang?.id
  ) || currentVocab?.translations?.[0]; // Fallback to first translation if target language not found

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-r from-blue-400 via-blue-300 to-gray-200 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/topics')}
              className="text-gray-600 hover:text-gray-800"
              title="Quay lại danh sách"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              {currentVocab.word || `Word ${currentVocabIndex + 1}`}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            <button className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
              title="Đóng và quay về Home"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Image/Avatar */}
        <div className="relative bg-gray-200 h-64 flex items-center justify-center">
          {currentVocab.avatar ? (
            <img src={currentVocab.avatar} alt={currentVocab.word} className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-500 text-sm">Avatar</div>
          )}
          <button
            onClick={handlePrevious}
            disabled={currentVocabIndex === 0}
            className="absolute left-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-gray-500 text-sm">Avatar</div>
          <button
            onClick={handleNext}
            disabled={currentVocabIndex >= vocabulariesWithTranslations.length - 1}
            className="absolute right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Language Entries */}
        <div className="p-6 space-y-4">
          {/* Source Language (if available) */}
          {sourceLang && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-3xl">{sourceLang.flag}</span>
              <div className="flex-1">
                <div className="font-semibold text-lg text-gray-800">{currentVocab.word}</div>
                {sourceTranslation?.pronunciation && (
                  <div className="text-sm text-gray-600 italic">{sourceTranslation.pronunciation}</div>
                )}
              </div>
              <div className="flex gap-2">
                {sourceTranslation?.audioUrl && (
                  <button
                    onClick={() => playAudio(sourceTranslation.audioUrl, currentVocab.word)}
                    className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </button>
                )}
                <button className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Target Language */}
          {targetTranslation && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <span className="text-3xl">{targetTranslation.language?.flag || targetLang?.flag || '🌐'}</span>
              <div className="flex-1">
                <div className="font-semibold text-lg text-gray-800">{targetTranslation.meaning}</div>
                {targetTranslation.pronunciation && (
                  <div className="text-sm text-gray-600 italic">{targetTranslation.pronunciation}</div>
                )}
                {targetTranslation.example && (
                  <div className="text-sm text-gray-500 mt-1 italic">"{targetTranslation.example}"</div>
                )}
              </div>
              <div className="flex gap-2">
                {targetTranslation.audioUrl && (
                  <button
                    onClick={() => playAudio(targetTranslation.audioUrl, targetTranslation.meaning)}
                    className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </button>
                )}
                <button className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          {!targetTranslation && (
            <div className="p-4 bg-yellow-50 rounded-lg text-center text-gray-600">
              Chưa có bản dịch cho từ vựng này
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="w-6 h-6 border-2 border-gray-300 rounded"></div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate(`/topics/${id}/flashcard`)}
              disabled={vocabulariesWithTranslations.length === 0}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition"
              title={vocabulariesWithTranslations.length === 0 ? 'Chưa có từ vựng để học' : 'Học với flashcard'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Học với Flashcard {vocabulariesWithTranslations.length > 0 && `(${vocabulariesWithTranslations.length})`}
            </button>
            <button className="flex items-center gap-2 bg-blue-400 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Unlock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
