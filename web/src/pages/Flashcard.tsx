import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';

interface Vocabulary {
  id: string;
  word: string;
  meaning: string;
  example: string | null;
  pronunciation: string | null;
  audioUrl: string | null;
}

export default function Flashcard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVocabularies();
    }
  }, [id]);

  const fetchVocabularies = async () => {
    try {
      const response = await api.get(`/topics/${id}`);
      setVocabularies(response.data.topic.vocabularies || []);
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

  const playAudio = () => {
    const currentVocab = vocabularies[currentIndex];
    if (currentVocab?.audioUrl) {
      const audio = new Audio(currentVocab.audioUrl);
      audio.play();
    } else if (currentVocab?.word) {
      // Fallback to browser TTS if no audio URL
      const utterance = new SpeechSynthesisUtterance(currentVocab.word);
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

  if (vocabularies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-400 via-blue-300 to-gray-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <p className="text-xl mb-4 text-gray-800">Chưa có từ vựng nào trong chủ đề này.</p>
          <button
            onClick={() => navigate(`/topics/${id}`)}
            className="px-6 py-3 bg-blue-400 text-white rounded-lg font-medium hover:bg-blue-500"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const currentVocab = vocabularies[currentIndex];

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-r from-blue-400 via-blue-300 to-gray-200 flex items-center justify-center p-4"
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
              {currentVocab.pronunciation && (
                <p className="text-xl text-gray-500 italic mb-4">{currentVocab.pronunciation}</p>
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
              <p className="text-xl mb-4">{currentVocab.meaning}</p>
              {currentVocab.example && (
                <div className="mt-4">
                  <p className="text-sm opacity-90 mb-2">Ví dụ:</p>
                  <p className="text-lg italic">"{currentVocab.example}"</p>
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

