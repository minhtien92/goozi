import { useEffect, useState } from 'react';
import api, { uploadFile } from '../config/api';

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
  const [editingVocab, setEditingVocab] = useState<Vocabulary | null>(null);
  const [formData, setFormData] = useState({
    word: '',
    topicId: '',
    order: '',
    avatar: '',
    isActive: true,
    translations: {} as Record<string, Record<number, { meaning: string; pronunciation: string; example: string; audioUrl: string }>>,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vocabRes, topicsRes, languagesRes] = await Promise.all([
        api.get('/vocabularies'),
        api.get('/topics'),
        api.get('/languages?isActive=true'),
      ]);
      setVocabularies(vocabRes.data.vocabularies);
      setTopics(topicsRes.data.topics);
      setLanguages(languagesRes.data.languages);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingVocab(null);
    const translations: Record<string, Record<number, any>> = {};
    languages.forEach((lang) => {
      translations[lang.id] = {
        1: { meaning: '', pronunciation: '', example: '', audioUrl: '' },
        2: { meaning: '', pronunciation: '', example: '', audioUrl: '' },
        3: { meaning: '', pronunciation: '', example: '', audioUrl: '' },
        4: { meaning: '', pronunciation: '', example: '', audioUrl: '' },
      };
    });
    setFormData({
      word: '',
      topicId: topics[0]?.id || '',
      order: '',
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
        1: { meaning: '', pronunciation: '', example: '', audioUrl: '' },
        2: { meaning: '', pronunciation: '', example: '', audioUrl: '' },
        3: { meaning: '', pronunciation: '', example: '', audioUrl: '' },
        4: { meaning: '', pronunciation: '', example: '', audioUrl: '' },
      };
    });

    // Fill in existing translations
    if (vocab.translations) {
      vocab.translations.forEach((trans) => {
        if (translations[trans.languageId]) {
          translations[trans.languageId][trans.version] = {
            meaning: trans.meaning || '',
            pronunciation: trans.pronunciation || '',
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
    if (!confirm('Bạn có chắc chắn muốn xóa từ vựng này?')) return;

    try {
      await api.delete(`/vocabularies/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting vocabulary:', error);
      alert('Xóa từ vựng thất bại');
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

  const handleAudioUpload = async (languageId: string, version: number, file: File) => {
    try {
      const response = await uploadFile('/upload/audio', file);

      if (response.data.url) {
        // Get full URL - response.data.url is already /uploads/audio/xxx.mp3
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
        const fullUrl = `${baseUrl}${response.data.url}`;
        updateTranslation(languageId, version, 'audioUrl', fullUrl);
      }
    } catch (error: any) {
      console.error('Error uploading audio:', error);
      alert('Upload audio thất bại: ' + (error.response?.data?.message || error.message));
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
          if (trans.meaning.trim()) {
            translationsArray.push({
              languageId,
              version,
              meaning: trans.meaning,
              pronunciation: trans.pronunciation || null,
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
    } catch (error) {
      console.error('Error saving vocabulary:', error);
      alert('Lưu từ vựng thất bại');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ height: 'calc(100vh - 100px)' }}>
      {/* Left Panel - Word List */}
      <div className="flex-fill" style={{ overflowY: 'auto', paddingRight: '10px' }}>
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3 className="card-title mb-0">Word</h3>
            <div className="d-flex align-items-center gap-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search..."
                style={{ width: '200px' }}
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
                    <th>Topic</th>
                    <th style={{ width: '100px' }}>Detail</th>
                    <th style={{ width: '80px' }}>Edit</th>
                    <th style={{ width: '80px' }}>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {vocabularies.map((vocab) => (
                    <tr key={vocab.id}>
                      <td>{vocab.order || '-'}</td>
                      <td>
                        {vocab.avatar ? (
                          <img src={vocab.avatar} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', backgroundColor: '#ddd', borderRadius: '4px' }}></div>
                        )}
                      </td>
                      <td>
                        <strong>{vocab.word}</strong>
                      </td>
                      <td>{vocab.topic?.name || 'N/A'}</td>
                      <td>
                        <button className="btn btn-sm btn-info" title="Detail">
                          <i className="fas fa-eye"></i>
                        </button>
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
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      {showModal && (
        <div className="card" style={{ width: '500px', marginLeft: '10px', overflowY: 'auto' }}>
          <div className="card-header">
            <h4 className="card-title mb-0">Add a new word</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Topic</label>
                <select
                  className="form-control"
                  value={formData.topicId}
                  onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                  required
                >
                  <option value="">Chọn chủ đề</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>No</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                  placeholder="Order number"
                />
              </div>

              <div className="form-group">
                <label>Avatar</label>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="text"
                    className="form-control"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="Avatar URL"
                  />
                  <button type="button" className="btn btn-secondary btn-sm">Upload</button>
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
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {languages.map((lang, langIndex) => (
                    <div key={lang.id} className="mb-3 p-2 border rounded">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="text-lg">{lang.flag}</span>
                        <strong>Language {langIndex + 1}</strong>
                        <span className="text-muted small">({lang.nativeName})</span>
                      </div>
                      {[1, 2, 3, 4].map((version) => {
                        const trans = formData.translations[lang.id]?.[version] || { meaning: '', pronunciation: '', example: '', audioUrl: '' };
                        return (
                          <div key={version} className="mb-2 p-2 bg-light rounded">
                            <div className="d-flex align-items-center gap-1 mb-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                style={{ minWidth: '45px' }}
                                title={`Version ${version}`}
                              >
                                V{version}
                              </button>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={trans.meaning}
                                onChange={(e) => updateTranslation(lang.id, version, 'meaning', e.target.value)}
                                placeholder="Meaning"
                              />
                            </div>
                            <div className="d-flex gap-1 mb-1">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={trans.pronunciation || ''}
                                onChange={(e) => updateTranslation(lang.id, version, 'pronunciation', e.target.value)}
                                placeholder="Pronunciation"
                              />
                              <div className="d-flex gap-1" style={{ flex: 1 }}>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={trans.audioUrl || ''}
                                  onChange={(e) => updateTranslation(lang.id, version, 'audioUrl', e.target.value)}
                                  placeholder="Audio URL"
                                />
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
                                <label
                                  htmlFor={`audio-upload-${lang.id}-${version}`}
                                  className="btn btn-sm btn-outline-primary mb-0"
                                  style={{ cursor: 'pointer' }}
                                  title="Upload audio file"
                                >
                                  <i className="fas fa-upload"></i>
                                </label>
                              </div>
                            </div>
                            <textarea
                              className="form-control form-control-sm"
                              rows={1}
                              value={trans.example || ''}
                              onChange={(e) => updateTranslation(lang.id, version, 'example', e.target.value)}
                              placeholder="Example sentence"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
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
                    Hoạt động
                  </label>
                </div>
              </div>

              <div className="d-flex justify-content-between mt-3">
                <button
                  type="button"
                  className="btn btn-default"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
