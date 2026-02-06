// Translation helper for header texts based on user's mother tongue

export interface Translations {
  vocabulary: string;
  searchTopics: string;
  back: string;
  backToList: string;
  close: string;
  noVocabularyFound: string;
  noVocabularyToLearn: string;
  viewDetails: string;
  chooseOtherTopic: string;
  loading: string;
  pronunciation: string;
  pleaseSelectLanguage: string;
}

const translations: Record<string, Translations> = {
  en: {
    vocabulary: 'Vocabulary',
    searchTopics: 'Search topics...',
    back: 'Back',
    backToList: 'Back to list',
    close: 'Close',
    noVocabularyFound: 'No vocabulary found',
    noVocabularyToLearn: 'No vocabulary to learn',
    viewDetails: 'View details',
    chooseOtherTopic: 'Choose other topic',
    loading: 'Loading...',
    pronunciation: 'Pronunciation',
    pleaseSelectLanguage: 'Please select learning language in profile to view translations',
  },
  vi: {
    vocabulary: 'Từ vựng',
    searchTopics: 'Tìm kiếm chủ đề...',
    back: 'Quay lại',
    backToList: 'Quay lại danh sách',
    close: 'Đóng',
    noVocabularyFound: 'Không tìm thấy từ vựng',
    noVocabularyToLearn: 'Chưa có từ vựng để học',
    viewDetails: 'Xem chi tiết',
    chooseOtherTopic: 'Chọn chủ đề khác',
    loading: 'Đang tải...',
    pronunciation: 'Phát âm',
    pleaseSelectLanguage: 'Vui lòng chọn ngôn ngữ học trong profile để xem bản dịch',
  },
  ko: {
    vocabulary: '어휘',
    searchTopics: '주제 검색...',
    back: '뒤로',
    backToList: '목록으로 돌아가기',
    close: '닫기',
    noVocabularyFound: '단어를 찾을 수 없습니다',
    noVocabularyToLearn: '학습할 단어가 없습니다',
    viewDetails: '자세히 보기',
    chooseOtherTopic: '다른 주제 선택',
    loading: '로딩 중...',
    pronunciation: '발음',
    pleaseSelectLanguage: '번역을 보려면 프로필에서 학습 언어를 선택하세요',
  },
  zh: {
    vocabulary: '词汇',
    searchTopics: '搜索主题...',
    back: '返回',
    backToList: '返回列表',
    close: '关闭',
    noVocabularyFound: '未找到词汇',
    noVocabularyToLearn: '没有可学习的词汇',
    viewDetails: '查看详情',
    chooseOtherTopic: '选择其他主题',
    loading: '加载中...',
    pronunciation: '发音',
    pleaseSelectLanguage: '请在个人资料中选择学习语言以查看翻译',
  },
  ja: {
    vocabulary: '語彙',
    searchTopics: 'トピックを検索...',
    back: '戻る',
    backToList: 'リストに戻る',
    close: '閉じる',
    noVocabularyFound: '語彙が見つかりません',
    noVocabularyToLearn: '学習する語彙がありません',
    viewDetails: '詳細を見る',
    chooseOtherTopic: '他のトピックを選択',
    loading: '読み込み中...',
    pronunciation: '発音',
    pleaseSelectLanguage: '翻訳を表示するには、プロフィールで学習言語を選択してください',
  },
  es: {
    vocabulary: 'Vocabulario',
    searchTopics: 'Buscar temas...',
    back: 'Atrás',
    backToList: 'Volver a la lista',
    close: 'Cerrar',
    noVocabularyFound: 'No se encontró vocabulario',
    noVocabularyToLearn: 'No hay vocabulario para aprender',
    viewDetails: 'Ver detalles',
    chooseOtherTopic: 'Elegir otro tema',
    loading: 'Cargando...',
    pronunciation: 'Pronunciación',
    pleaseSelectLanguage: 'Por favor seleccione el idioma de aprendizaje en el perfil para ver las traducciones',
  },
  fr: {
    vocabulary: 'Vocabulaire',
    searchTopics: 'Rechercher des sujets...',
    back: 'Retour',
    backToList: 'Retour à la liste',
    close: 'Fermer',
    noVocabularyFound: 'Aucun vocabulaire trouvé',
    noVocabularyToLearn: 'Aucun vocabulaire à apprendre',
    viewDetails: 'Voir les détails',
    chooseOtherTopic: 'Choisir un autre sujet',
    loading: 'Chargement...',
    pronunciation: 'Prononciation',
    pleaseSelectLanguage: 'Veuillez sélectionner la langue d\'apprentissage dans le profil pour voir les traductions',
  },
  de: {
    vocabulary: 'Wortschatz',
    searchTopics: 'Themen suchen...',
    back: 'Zurück',
    backToList: 'Zurück zur Liste',
    close: 'Schließen',
    noVocabularyFound: 'Kein Wortschatz gefunden',
    noVocabularyToLearn: 'Kein Wortschatz zum Lernen',
    viewDetails: 'Details anzeigen',
    chooseOtherTopic: 'Anderes Thema wählen',
    loading: 'Laden...',
    pronunciation: 'Aussprache',
    pleaseSelectLanguage: 'Bitte wählen Sie die Lernsprache im Profil aus, um Übersetzungen anzuzeigen',
  },
};

export const getTranslation = (langCode: string | undefined): Translations => {
  const code = langCode?.toLowerCase() || 'en';
  return translations[code] || translations.en;
};

export const t = (key: keyof Translations, langCode?: string): string => {
  const translation = getTranslation(langCode);
  return translation[key] || translations.en[key];
};

