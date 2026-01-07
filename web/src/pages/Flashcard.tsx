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
    return () => {
    const currentVocab = vocabularies[currentIndex];
    if (!currentVocab) return;

    // Get target translation for audio
    const targetTranslation = getTargetTranslation(currentVocab);
    
    if (targetTranslation?.audioUrl) {
        if (currentAudio) {
          if (!currentAudio.paused && currentAudio.src === targetTranslation.audioUrl) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
            return;
          } else {
            currentAudio.pause();
            currentAudio.currentTime = 0;
          }
        }
        const audio = new Audio(targetTranslation.audioUrl);
        currentAudio = audio;
        audio.play().catch((err) => console.error('Error playing audio:', err));
        audio.onended = () => {
          currentAudio = null;
        };
    } else if (currentVocab.word) {
      // Fallback to browser TTS if no audio URL
      const utterance = new SpeechSynthesisUtterance(currentVocab.word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
    };
  })();

  const getTargetTranslation = (vocab: Vocabulary) => {
    if (!vocab.translations || vocab.translations.length === 0) return null;
    
    // Try to find translation for target language
    if (topic?.targetLanguage?.id) {
      const targetTrans = vocab.translations.find(
        (t) => t.languageId === topic.targetLanguage?.id
      );
      if (targetTrans) return targetTrans;
    }
    
    // Fallback to first translation
    return vocab.translations[0];
  };

  const getMeaning = (vocab: Vocabulary) => {
    const translation = getTargetTranslation(vocab);
    if (translation?.meaning) {
      return translation.meaning;
    }
    // Check if vocab has any translations at all
    if (vocab.translations && vocab.translations.length > 0) {
      return vocab.translations[0].meaning || 'Chưa có bản dịch';
    }
    return 'Chưa có bản dịch';
  };

  const getPronunciation = (vocab: Vocabulary) => {
    const translation = getTargetTranslation(vocab);
    return translation?.pronunciation || null;
  };

  const getExample = (vocab: Vocabulary) => {
    const translation = getTargetTranslation(vocab);
    return translation?.example || null;
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

  const handleClose = () => {
    navigate('/');
  };

  console.log('Flashcard: Rendering flashcard UI with', vocabularies.length, 'vocabularies');

  return (
    <div 
      className="min-h-screen bg-gradient-to-r from-blue-400 via-blue-300 to-gray-200 flex items-center justify-center p-4 fixed inset-0 z-50"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-gray-200 font-medium"
            title="Đóng và quay về Home"
          >
            ✕ Đóng
          </button>
          <span className="text-sm text-white bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full">
            {currentIndex + 1} / {vocabularies.length}
          </span>
        </div>

      <div
        className="relative h-96 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`absolute inset-0 transition-transform duration-500 ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front side */}
          <div
            className={`absolute inset-0 backface-hidden ${
              isFlipped ? 'hidden' : ''
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="bg-white rounded-lg shadow-xl p-8 h-full flex flex-col items-center justify-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{currentVocab.word}</h2>
              {getPronunciation(currentVocab) && (
                <p className="text-xl text-gray-500 italic mb-4">{getPronunciation(currentVocab)}</p>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                🔊 Phát âm
              </button>
              <p className="text-sm text-gray-500 mt-4">Nhấn để xem nghĩa</p>
            </div>
          </div>

          {/* Back side */}
          <div
            className={`absolute inset-0 backface-hidden ${
              !isFlipped ? 'hidden' : ''
            }`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="bg-blue-600 rounded-lg shadow-xl p-8 h-full flex flex-col items-center justify-center text-white">
              <h3 className="text-2xl font-semibold mb-4">Nghĩa:</h3>
              <p className="text-xl mb-4">{getMeaning(currentVocab)}</p>
              {getExample(currentVocab) && (
                <div className="mt-4">
                  <p className="text-sm opacity-90 mb-2">Ví dụ:</p>
                  <p className="text-lg italic">"{getExample(currentVocab)}"</p>
                </div>
              )}
              <p className="text-sm opacity-75 mt-4">Nhấn để xem từ</p>
            </div>
          </div>
        </div>
      </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-6 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            ← Trước
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === vocabularies.length - 1}
            className="px-6 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  );
}

