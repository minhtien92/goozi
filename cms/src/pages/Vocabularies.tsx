import { useEffect, useState } from 'react';
import api, { uploadFile } from '../config/api';
import Pagination from '../components/Pagination';

const DEFAULT_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"80\"%3E%3Crect width=\"120\" height=\"80\" fill=\"%23f0f0f0\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" text-anchor=\"middle\" dy=\".3em\" fill=\"%23999\" font-size=\"12\"%3ENo Image%3C/text%3E%3C/svg%3E';

interface Topic {
  id: string;
  name: string;
}

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

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
  topicId: string;
  avatar: string | null;
  order: number | null;
  topic?: Topic;
  translations?: VocabularyTranslation[];
  isActive: boolean;
  createdAt: string;
}

export default function Vocabularies() {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  // const [showDetailModal, setShowDetailModal] = useState(false);
  // const [detailVocab, setDetailVocab] = useState<Vocabulary | null>(null);
  const [editingVocab, setEditingVocab] = useState<Vocabulary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  });
  const [playingAudios, setPlayingAudios] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    word: '',
    topicId: '',
    order: '',
    avatar: '',
    isActive: true,
    translations: {} as Record<
      string,
      Record<number, { meaning: string; pronunciation: string; ipa: string; example: string; audioUrl: string }>
    >,
  });

  useEffect(() => {
    fetchData();
  }, [currentPage, selectedTopicId]);

  // Auto open/close form based on screen size
  useEffect(() => {
    if (loading || topics.length === 0 || languages.length === 0) return; // Wait for data to load

    let previousWidth = window.innerWidth;
    let isInitialMount = true;

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const isLargeScreen = currentWidth > 1500;
      const wasLargeScreen = previousWidth > 1500;

      if (isInitialMount) {
        // On initial mount, only auto-open on large screens
        if (isLargeScreen && !editingVocab && !showModal) {
          const translations: Record<string, Record<number, any>> = {};
          languages.forEach((lang) => {
            translations[lang.id] = {
              1: { meaning: '', pronunciation: '', ipa: '', example: '', audioUrl: '' },
              2: { meaning: '', pronunciation: '', ipa: '', example: '', audioUrl: '' },
              3: { meaning: '', pronunciation: '', ipa: '', example: '', audioUrl: '' },
              4: { meaning: '', pronunciation: '', ipa: '', example: '', audioUrl: '' },
            };
          });
          const maxOrder = vocabularies.length > 0 
            ? Math.max(...vocabularies.map(v => v.order || 0)) + 1 
            : 1;
          setFormData({
            word: '',
            topicId: topics[0]?.id || '',
            order: maxOrder.toString(),
            avatar: '',
            isActive: true,
            translations,
          });
          setShowModal(true);
        }
        isInitialMount = false;
      } else {
        // On resize, handle transitions
        if (isLargeScreen && !editingVocab && !showModal) {
          // Resize from small to large: auto open
          const translations: Record<string, Record<number, any>> = {};
          languages.forEach((lang) => {
            translations[lang.id] = {
              1: { meaning: '', pronunciation: '', example: '', audioUrl: '' },
              2: { meaning: '', pronunciation: '', example: '', audioUrl: '' },
              3: { meaning: '', pronunciation: '', example: '', audioUrl: '' },
              4: { meaning: '', pronunciation: '', example: '', audioUrl: '' },
            };
          });
          const maxOrder = vocabularies.length > 0 
            ? Math.max(...vocabularies.map(v => v.order || 0)) + 1 
            : 1;
          setFormData({
            word: '',
            topicId: topics[0]?.id || '',
            order: maxOrder.toString(),
            avatar: '',
            isActive: true,
            translations,
          });
          setShowModal(true);
        } else if (!isLargeScreen && wasLargeScreen && showModal && !editingVocab) {
          // Resize from large to small: auto close (only when transitioning from large to small)
          setShowModal(false);
        }
      }

      previousWidth = currentWidth;
    };

    // Check on mount
    handleResize();

    // Listen to resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loading, topics.length, languages.length, editingVocab, vocabularies.length]);

  const fetchData = async () => {
    try {
      const params: any = { page: currentPage, limit: 10 };
      if (selectedTopicId) {
        params.topicId = selectedTopicId;
      }
      
      const [vocabRes, topicsRes, languagesRes] = await Promise.all([
        api.get('/vocabularies', { params }),
        api.get('/topics'),
        api.get('/languages?isActive=true'),
      ]);
      setVocabularies(vocabRes.data.vocabularies);
      setPagination(vocabRes.data.pagination);
      setTopics(topicsRes.data.topics);
      setLanguages(languagesRes.data.languages);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // const fetchVocabularyDetail = async (id: string) => {
  //   try {
  //     const response = await api.get(`/vocabularies/${id}`);
  //     return response.data.vocabulary;
  //   } catch (error) {
  //     console.error('Error fetching vocabulary detail:', error);
  //     return null;
  //   }
  // };

  const handleCreate = () => {
    if (topics.length === 0) {
      alert('No topics available. Please create a topic first before adding vocabulary.');
      return;
    }
    
    setEditingVocab(null);
    const translations: Record<string, Record<number, any>> = {};
    languages.forEach((lang) => {
      translations[lang.id] = {
        1: { meaning: '', pronunciation: '', ipa: '', example: '', audioUrl: '' },
        2: { meaning: '', pronunciation: '', ipa: '', example: '', audioUrl: '' },
        3: { meaning: '', pronunciation: '', ipa: '', example: '', audioUrl: '' },
        4: { meaning: '', pronunciation: '', ipa: '', example: '', audioUrl: '' },
      };
    });
    
    // Tự động tính order (số thứ tự tiếp theo)
    const maxOrder = vocabularies.length > 0 
      ? Math.max(...vocabularies.map(v => v.order || 0)) + 1 
      : 1;
    
    setFormData({
      word: '',
      topicId: topics[0]?.id || '',
      order: maxOrder.toString(),
      avatar: '',
      isActive: true,
      translations,
    });
    setShowModal(true);
  };

  const handleEdit = (vocab: Vocabulary) => {
    setEditingVocab(vocab);
    const translations: Record<string, Record<number, any>> = {};
    
    // Initialize all languages with empty versions
    languages.forEach((lang) => {
      translations[lang.id] = {
        1: { meaning: '', pronunciation: '', ipa: '', example: '', audioUrl: '' },
        2: { meaning: '', pronunciation: '', ipa: '', example: '', audioUrl: '' },
        3: { meaning: '', pronunciation: '', ipa: '', example: '', audioUrl: '' },
        4: { meaning: '', pronunciation: '', ipa: '', example: '', audioUrl: '' },
      };
    });

    // Fill in existing translations
    if (vocab.translations) {
      vocab.translations.forEach((trans) => {
        if (translations[trans.languageId] && trans.version >= 1 && trans.version <= 4) {
          translations[trans.languageId][trans.version] = {
            meaning: trans.meaning || '',
            pronunciation: trans.pronunciation || '',
            ipa: trans.ipa || '',
            example: trans.example || '',
            audioUrl: trans.audioUrl || '',
          };
        }
      });
    }

    setFormData({
      word: vocab.word,
      topicId: vocab.topicId,
      order: vocab.order?.toString() || '',
      avatar: vocab.avatar || '',
      isActive: vocab.isActive,
      translations,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vocabulary?')) return;

    try {
      await api.delete(`/vocabularies/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting vocabulary:', error);
      alert('Failed to delete vocabulary');
    }
  };

  const updateTranslation = (languageId: string, version: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [languageId]: {
          ...prev.translations[languageId],
          [version]: {
            ...prev.translations[languageId][version],
            [field]: value,
          },
        },
      },
    }));
  };

  // Update meaning for all versions of a language (single meaning per language)
  const updateLanguageMeaning = (languageId: string, value: string) => {
    setFormData((prev) => {
      const langEntry = prev.translations[languageId] || {};
      const updated: Record<number, any> = { ...langEntry };
      [1, 2, 3, 4].forEach((v) => {
        updated[v] = {
          ...(updated[v] || { meaning: '', pronunciation: '', ipa: '', example: '', audioUrl: '' }),
          meaning: value,
        };
      });
      return {
        ...prev,
        translations: {
          ...prev.translations,
          [languageId]: updated,
        },
      };
    });
  };

  // Update IPA for all versions of a language (single IPA per language)
  const updateLanguageIPA = (languageId: string, value: string) => {
    setFormData((prev) => {
      const langEntry = prev.translations[languageId] || {};
      const updated: Record<number, any> = { ...langEntry };
      [1, 2, 3, 4].forEach((v) => {
        updated[v] = {
          ...(updated[v] || { meaning: '', pronunciation: '', ipa: '', example: '', audioUrl: '' }),
          ipa: value,
        };
      });
      return {
        ...prev,
        translations: {
          ...prev.translations,
          [languageId]: updated,
        },
      };
    });
  };

  const handleAudioUpload = async (languageId: string, version: number, file: File) => {
    try {
      const response = await uploadFile('/upload/audio', file);

      if (response.data.url) {
        // Get full URL - ensure baseUrl has proper format
        const viteApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        // Only remove /api at the end of URL, not in the middle (e.g., api.goozi.org)
        let baseUrl = viteApiUrl.endsWith('/api') ? viteApiUrl.slice(0, -4) : viteApiUrl.replace(/\/api$/, '');
        if (!baseUrl) baseUrl = 'http://localhost:3001';
        
        // Ensure baseUrl starts with http:// or https://
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          baseUrl = `http://${baseUrl}`;
        }
        
        // Ensure response.data.url starts with /
        const audioPath = response.data.url.startsWith('/') ? response.data.url : `/${response.data.url}`;
        const fullUrl = `${baseUrl}${audioPath}`;
        
        // Debug logging
        console.log('Upload audio - VITE_API_URL:', viteApiUrl);
        console.log('Upload audio - baseUrl:', baseUrl);
        console.log('Upload audio - response.data.url:', response.data.url);
        console.log('Upload audio - fullUrl:', fullUrl);
        
        updateTranslation(languageId, version, 'audioUrl', fullUrl);
      }
    } catch (error: any) {
      console.error('Error uploading audio:', error);
      alert('Failed to upload audio: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const response = await uploadFile('/upload/image', file);

      if (response.data.url) {
        // Get full URL - ensure baseUrl has proper format
        const viteApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        // Only remove /api at the end of URL, not in the middle (e.g., api.goozi.org)
        let baseUrl = viteApiUrl.endsWith('/api') ? viteApiUrl.slice(0, -4) : viteApiUrl.replace(/\/api$/, '');
        if (!baseUrl) baseUrl = 'http://localhost:3001';
        
        // Ensure baseUrl starts with http:// or https://
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          baseUrl = `http://${baseUrl}`;
        }
        
        // Ensure response.data.url starts with /
        const imagePath = response.data.url.startsWith('/') ? response.data.url : `/${response.data.url}`;
        const fullUrl = `${baseUrl}${imagePath}`;
        
        // Debug logging
        console.log('Upload avatar - VITE_API_URL:', viteApiUrl);
        console.log('Upload avatar - baseUrl:', baseUrl);
        console.log('Upload avatar - response.data.url:', response.data.url);
        console.log('Upload avatar - fullUrl:', fullUrl);
        
        setFormData({ ...formData, avatar: fullUrl });
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert translations object to array
      const translationsArray: any[] = [];
      Object.keys(formData.translations).forEach((languageId) => {
        [1, 2, 3, 4].forEach((version) => {
          const trans = formData.translations[languageId][version];
          if (trans && trans.meaning && trans.meaning.trim()) {
            translationsArray.push({
              languageId,
              version,
              meaning: trans.meaning,
              pronunciation: trans.pronunciation || null,
              ipa: trans.ipa || null,
              example: trans.example || null,
              audioUrl: trans.audioUrl || null,
            });
          }
        });
      });

      const payload = {
        word: formData.word,
        topicId: formData.topicId,
        order: formData.order ? parseInt(formData.order) : null,
        avatar: formData.avatar || null,
        isActive: formData.isActive,
        translations: translationsArray,
      };

      if (editingVocab) {
        await api.put(`/vocabularies/${editingVocab.id}`, payload);
      } else {
        await api.post('/vocabularies', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving vocabulary:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save vocabulary';
      alert(`Failed to save vocabulary: ${errorMessage}`);
      
      // If topic not found, suggest checking topic selection
      if (errorMessage.includes('Topic not found') || error.response?.status === 404) {
        alert('Topic does not exist. Please select a different topic.');
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Left Panel - Word List */}
      <div className="flex-fill" style={{ overflowY: 'auto', paddingRight: '10px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title mb-0">Word</h3>
            <div className="card-tools d-flex align-items-center" style={{ gap: '10px' }}>
              <select
                className="form-control form-control-sm"
                style={{ width: '200px' }}
                value={selectedTopicId}
                onChange={(e) => {
                  setSelectedTopicId(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Topics</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search..."
                style={{ width: '200px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleCreate}
              >
                <i className="fas fa-plus mr-1"></i>
                Add a new word
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>No</th>
                    <th style={{ width: '80px' }}>Avatar</th>
                    <th>English</th>
                    <th style={{ width: '160px' }}>Topic</th>
                    <th style={{ width: '80px' }}>Edit</th>
                    <th style={{ width: '80px' }}>Delete</th>
                  </tr>
                </thead>
                <tbody>
                {vocabularies
                  .filter((vocab) => {
                    // Filter by search term (topic filter is handled by API)
                    if (searchTerm.trim()) {
                    const keyword = searchTerm.trim().toLowerCase();
                    return (
                      vocab.word.toLowerCase().includes(keyword) ||
                      (vocab.topic?.name || '').toLowerCase().includes(keyword)
                    );
                    }
                    return true;
                  })
                  .map((vocab) => (
                    <tr key={vocab.id}>
                      <td>{vocab.order || '-'}</td>
                      <td>
                        <img
                          src={vocab.avatar || DEFAULT_IMAGE}
                          alt={vocab.word}
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== DEFAULT_IMAGE) {
                              target.src = DEFAULT_IMAGE;
                            }
                          }}
                        />
                      </td>
                      <td>
                        <strong>{vocab.word}</strong>
                      </td>
                      <td>
                        <div
                          className="text-truncate"
                          style={{ maxWidth: '150px' }}
                          title={vocab.topic?.name || 'N/A'}
                        >
                          {vocab.topic?.name || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => handleEdit(vocab)}
                          className="btn btn-sm btn-success"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(vocab.id)}
                          className="btn btn-sm btn-danger"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-footer">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form (inline card như cũ) */}
      {showModal && (
        <div className="card" style={{ width: '800px', marginLeft: '10px', overflowY: 'auto' }}>
          <div className="card-header d-flex align-items-center">
            <h4 className="card-title mb-0" style={{ flex: 1 }}>{editingVocab ? 'Edit word' : 'Add a new word'}</h4>
            <div className="d-flex" style={{ gap: '8px', marginLeft: 'auto' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setEditingVocab(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" form="vocab-form" className="btn btn-sm btn-primary">
                Save
              </button>
            </div>
          </div>
          <div className="card-body">
            <form id="vocab-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div style={{ flex: '0 0 60%', maxWidth: '60%', paddingRight: '15px' }}>
              <div className="form-group">
                <label>Topic {!formData.topicId && <span className="text-danger">*</span>}</label>
                <select
                  className="form-control"
                  value={formData.topicId}
                  onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                  required
                >
                  <option value="">Select Topic</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
                {topics.length === 0 && (
                  <small className="text-danger d-block mt-1">No topics available. Please create a topic first.</small>
                )}
              </div>
                </div>
                <div style={{ flex: '0 0 40%', maxWidth: '40%', paddingLeft: '15px' }}>
                  <div className="form-group d-flex align-items-center justify-content-end" style={{ gap: '10px' }}>
                    <div
                      className="d-flex flex-column align-items-center justify-content-center"
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '0.375rem',
                        backgroundColor: '#fff',
                      }}
                    >
                      <label style={{ marginBottom: '0', fontWeight: 'bold' }}>Avatar</label>
                    </div>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '100px',
                        height: '100px',
                        cursor: 'pointer',
                        backgroundImage: `url(${formData.avatar || DEFAULT_IMAGE})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1px solid #ced4da',
                        borderRadius: '0.375rem',
                      }}
                      onClick={() => document.getElementById('avatar-file-input')?.click()}
                      title="Click to select image"
                    >
                      {!formData.avatar && <span className="text-muted">Select Image</span>}
                    </div>
                <input
                      type="file"
                      accept="image/*"
                      className="d-none"
                      id="avatar-file-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleAvatarUpload(file);
                        }
                        e.target.value = '';
                      }}
                />
              </div>
                </div>
              </div>

              <div className="form-group">
                <label>Word (English)</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.word}
                  onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                  required
                  placeholder="Enter word"
                />
              </div>

              {/* Language Fields */}
              <div className="form-group">
                <label className="mb-3">Translations</label>
                <div>
                  {languages.map((lang) => {
                    const firstMeaning =
                      formData.translations[lang.id]?.[1]?.meaning ||
                      formData.translations[lang.id]?.[2]?.meaning ||
                      formData.translations[lang.id]?.[3]?.meaning ||
                      formData.translations[lang.id]?.[4]?.meaning || '';
                    const firstIPA =
                      formData.translations[lang.id]?.[1]?.ipa ||
                      formData.translations[lang.id]?.[2]?.ipa ||
                      formData.translations[lang.id]?.[3]?.ipa ||
                      formData.translations[lang.id]?.[4]?.ipa ||
                      '';
                    return (
                    <div key={lang.id} className="mb-3 p-2 border rounded">
                      <div className="d-flex align-items-center mb-2" style={{ gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem', lineHeight: '1', minWidth: '28px', textAlign: 'center' }}>{lang.flag}</span>
                        <span className="text-muted" style={{ fontWeight: '500' }}>{lang.nativeName}</span>
                      </div>
                        <div className="d-flex align-items-start" style={{ gap: '8px' }}>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={firstMeaning}
                            onChange={(e) => updateLanguageMeaning(lang.id, e.target.value)}
                            placeholder="Meaning"
                            style={{ flex: 1, marginTop: '0px', marginBottom: '0px', height: '100%' }}
                          />
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={firstIPA}
                            onChange={(e) => updateLanguageIPA(lang.id, e.target.value)}
                            placeholder="IPA (optional)"
                            style={{ flex: 1, marginTop: '0px', marginBottom: '0px', height: '100%' }}
                          />
                          <div className="d-flex" style={{ gap: '8px' }}>
                      {[1, 2, 3, 4].map((version) => {
                              const trans = formData.translations[lang.id]?.[version] || { audioUrl: '' };
                        return (
                                <div key={version} className="d-flex" style={{ gap: '6px', alignItems: 'center' }}>
                              <button
                                type="button"
                                className={`btn btn-sm ${trans.audioUrl ? 'btn-primary' : 'btn-outline-primary'}`}
                                    style={{
                                      minWidth: '45px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      marginTop: '0px',
                                      marginBottom: '0px',
                                      height: '100%',
                                    }}
                                    title={`V${version}`}
                                    onClick={() =>
                                      document.getElementById(`audio-upload-${lang.id}-${version}`)?.click()
                                    }
                              >
                                V{version}
                              </button>
                                  <audio
                                    id={`audio-player-${lang.id}-${version}`}
                                    src={trans.audioUrl || ''}
                                    style={{ display: 'none' }}
                                    onPlay={() => {
                                      setPlayingAudios(prev => ({ ...prev, [`${lang.id}-${version}`]: true }));
                                    }}
                                    onPause={() => {
                                      setPlayingAudios(prev => ({ ...prev, [`${lang.id}-${version}`]: false }));
                                    }}
                                    onEnded={() => {
                                      setPlayingAudios(prev => ({ ...prev, [`${lang.id}-${version}`]: false }));
                                    }}
                                  />
                                  {trans.audioUrl ? (
                                    <button
                                      type="button"
                                      className={`btn btn-sm mb-0 ${playingAudios[`${lang.id}-${version}`] ? 'btn-danger' : 'btn-success'}`}
                                      title={playingAudios[`${lang.id}-${version}`] ? "Stop audio" : "Play audio"}
                                      style={{ marginTop: '0px', marginBottom: '0px', height: '100%' }}
                                      onClick={() => {
                                        const audioEl = document.getElementById(
                                          `audio-player-${lang.id}-${version}`
                                        ) as HTMLAudioElement | null;
                                        if (audioEl) {
                                          if (!audioEl.paused) {
                                            audioEl.pause();
                                            audioEl.currentTime = 0;
                                          } else {
                                            audioEl.currentTime = 0;
                                            audioEl
                                              .play()
                                              .catch((err) => console.error('Error playing audio:', err));
                                          }
                                        }
                                      }}
                                    >
                                      <i className={`fas ${playingAudios[`${lang.id}-${version}`] ? 'fa-stop' : 'fa-play'}`}></i>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-secondary mb-0"
                                      disabled
                                      title="No audio uploaded"
                                      style={{ marginTop: '0px', marginBottom: '0px', height: '100%' }}
                                    >
                                      <i className="fas fa-play"></i>
                                    </button>
                                  )}
                                <input
                                  type="file"
                                  accept="audio/*"
                                  className="d-none"
                                  id={`audio-upload-${lang.id}-${version}`}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      await handleAudioUpload(lang.id, version, file);
                                    }
                                    e.target.value = ''; // Reset input
                                  }}
                            />
                          </div>
                        );
                      })}
                    </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <div className="custom-control custom-switch">
                  <input
                    type="checkbox"
                    className="custom-control-input"
                    id="vocabActiveSwitch"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <label className="custom-control-label" htmlFor="vocabActiveSwitch">
                    Active
                  </label>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal has been removed as requested */}
    </div>
  );
}
