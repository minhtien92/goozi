import { useEffect, useState } from 'react';
import api, { uploadFile } from '../config/api';
import Pagination from '../components/Pagination';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const DEFAULT_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"80\"%3E%3Crect width=\"120\" height=\"80\" fill=\"%23f0f0f0\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" text-anchor=\"middle\" dy=\".3em\" fill=\"%23999\" font-size=\"12\"%3ENo Image%3C/text%3E%3C/svg%3E';

interface TopicTranslation {
  id: string;
  languageId: string;
  meaning: string;
  ipa?: string | null;
  version: number;
  audioUrl: string | null;
  language?: Language;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  image: string | null;
  order: number | null;
  isActive: boolean;
  translations?: TopicTranslation[];
  createdAt: string;
}

export default function Topics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    order: '',
    isActive: true,
    translations: {} as Record<
      string,
      Record<number, { meaning: string; ipa: string; audioUrl: string }>
    >,
  });

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [currentPage]);

  // Auto open/close form based on screen size
  useEffect(() => {
    if (loading || languages.length === 0) return; // Wait for data to load

    let previousWidth = window.innerWidth;
    let isInitialMount = true;

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const isLargeScreen = currentWidth > 1500;
      const wasLargeScreen = previousWidth > 1500;

      if (isInitialMount) {
        // On initial mount, only auto-open on large screens
        if (isLargeScreen && !editingTopic && !showModal) {
          const maxOrder = topics.length > 0 
            ? Math.max(...topics.map(t => t.order || 0)) + 1 
            : 1;
          const translations: Record<string, Record<number, any>> = {};
          languages.forEach((lang) => {
            translations[lang.id] = {
              1: { meaning: '', ipa: '', audioUrl: '' },
              2: { meaning: '', ipa: '', audioUrl: '' },
              3: { meaning: '', ipa: '', audioUrl: '' },
              4: { meaning: '', ipa: '', audioUrl: '' },
            };
          });
          setFormData({ 
            name: '', 
            description: '', 
            image: '', 
            order: maxOrder.toString(),
            isActive: true,
            translations,
          });
          setShowModal(true);
        }
        isInitialMount = false;
      } else {
        // On resize, handle transitions
        if (isLargeScreen && !editingTopic && !showModal) {
          // Resize from small to large: auto open
          const maxOrder = topics.length > 0 
            ? Math.max(...topics.map(t => t.order || 0)) + 1 
            : 1;
          const translations: Record<string, Record<number, any>> = {};
          languages.forEach((lang) => {
            translations[lang.id] = {
              1: { meaning: '', audioUrl: '' },
              2: { meaning: '', audioUrl: '' },
              3: { meaning: '', audioUrl: '' },
              4: { meaning: '', audioUrl: '' },
            };
          });
          setFormData({ 
            name: '', 
            description: '', 
            image: '', 
            order: maxOrder.toString(),
            isActive: true,
            translations,
          });
          setShowModal(true);
        } else if (!isLargeScreen && wasLargeScreen && showModal && !editingTopic) {
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
  }, [loading, languages.length, editingTopic, topics.length]);

  const fetchLanguages = async () => {
    try {
      const response = await api.get('/languages?isActive=true');
      setLanguages(response.data.languages);
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await api.get('/topics', {
        params: { page: currentPage, limit: 10 },
      });
      const sorted = response.data.topics.sort((a: Topic, b: Topic) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderB - orderA; // Descending: high to low
      });
      setTopics(sorted);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTopic(null);
    
    // Tự động tính order (số thứ tự tiếp theo)
    const maxOrder = topics.length > 0 
      ? Math.max(...topics.map(t => t.order || 0)) + 1 
      : 1;
    
    const translations: Record<string, Record<number, any>> = {};
    languages.forEach((lang) => {
      translations[lang.id] = {
        1: { meaning: '', ipa: '', audioUrl: '' },
        2: { meaning: '', ipa: '', audioUrl: '' },
        3: { meaning: '', ipa: '', audioUrl: '' },
        4: { meaning: '', ipa: '', audioUrl: '' },
      };
    });
    
    setFormData({ 
      name: '', 
      description: '', 
      image: '', 
      order: maxOrder.toString(),
      isActive: true,
      translations,
    });
    setShowModal(true);
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    
    const translations: Record<string, Record<number, any>> = {};
    
    // Initialize all languages with empty versions
    languages.forEach((lang) => {
      translations[lang.id] = {
        1: { meaning: '', ipa: '', audioUrl: '' },
        2: { meaning: '', ipa: '', audioUrl: '' },
        3: { meaning: '', ipa: '', audioUrl: '' },
        4: { meaning: '', ipa: '', audioUrl: '' },
      };
    });

    // Fill in existing translations
    if (topic.translations) {
      topic.translations.forEach((trans) => {
        if (translations[trans.languageId] && trans.version >= 1 && trans.version <= 4) {
          translations[trans.languageId][trans.version] = {
            meaning: trans.meaning || '',
            ipa: trans.ipa || '',
            audioUrl: trans.audioUrl || '',
          };
        }
      });
    }

    setFormData({
      name: topic.name,
      description: topic.description || '',
      image: topic.image || '',
      order: topic.order?.toString() || '',
      isActive: topic.isActive,
      translations,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;

    try {
      await api.delete(`/topics/${id}`);
      fetchTopics();
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic');
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
          ...(updated[v] || { meaning: '', ipa: '', audioUrl: '' }),
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

  // Update IPA for all versions of a language
  const updateLanguageIPA = (languageId: string, value: string) => {
    setFormData((prev) => {
      const langEntry = prev.translations[languageId] || {};
      const updated: Record<number, any> = { ...langEntry };
      [1, 2, 3, 4].forEach((v) => {
        updated[v] = {
          ...(updated[v] || { meaning: '', ipa: '', audioUrl: '' }),
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
        
        console.log('Upload audio - fullUrl:', fullUrl);
        
        updateTranslation(languageId, version, 'audioUrl', fullUrl);
      }
    } catch (error: any) {
      console.error('Error uploading audio:', error);
      alert('Failed to upload audio: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleImageUpload = async (file: File) => {
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
        
        console.log('Upload image - fullUrl:', fullUrl);
        
        setFormData({ ...formData, image: fullUrl });
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image: ' + (error.response?.data?.message || error.message));
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
              ipa: trans.ipa || null,
              audioUrl: trans.audioUrl || null,
            });
          }
        });
      });

      const payload = {
        name: formData.name,
        description: formData.description,
        order: formData.order ? parseInt(formData.order) : null,
        image: formData.image && formData.image.trim() ? formData.image.trim() : null,
        isActive: formData.isActive,
        translations: translationsArray,
      };

      if (editingTopic) {
        await api.put(`/topics/${editingTopic.id}`, payload);
      } else {
        await api.post('/topics', payload);
      }
      setShowModal(false);
      fetchTopics();
    } catch (error: any) {
      console.error('Error saving topic:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save topic';
      alert(errorMessage);
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

  const filteredTopics = topics.filter((topic) => {
    if (!searchTerm.trim()) return true;
    const keyword = searchTerm.trim().toLowerCase();
    return (
      topic.name.toLowerCase().includes(keyword) ||
      (topic.description && topic.description.toLowerCase().includes(keyword))
    );
  });

  return (
    <div className="d-flex" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Left Panel - Topic List */}
      <div className="flex-fill" style={{ overflowY: 'auto', paddingRight: '10px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title mb-0">Topics</h3>
            <div className="card-tools d-flex align-items-center" style={{ gap: '10px' }}>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '200px' }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleCreate}
              >
                <i className="fas fa-plus mr-1"></i>
                Add a new topic
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>Order</th>
                    <th style={{ width: '80px' }}>Image</th>
                    <th>Topic Name</th>
                    <th style={{ width: '80px' }}>Edit</th>
                    <th style={{ width: '80px' }}>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTopics.map((topic) => (
                    <tr key={topic.id}>
                      <td>{topic.order || '-'}</td>
                      <td>
                        <img
                          src={topic.image || DEFAULT_IMAGE}
                          alt={topic.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== DEFAULT_IMAGE) {
                              target.src = DEFAULT_IMAGE;
                            }
                          }}
                        />
                      </td>
                      <td>
                        <div className="font-weight-bold">{topic.name}</div>
                        {topic.description && (
                          <div
                            className="text-muted small text-truncate"
                            style={{ maxWidth: '200px' }}
                            title={topic.description}
                          >
                            {topic.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleEdit(topic)}
                          className="btn btn-sm btn-success"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(topic.id)}
                          className="btn btn-sm btn-danger"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {topics.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">
                        No topics yet
                      </td>
                    </tr>
                  )}
                  {topics.length > 0 && filteredTopics.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">
                        No matching topics found
                      </td>
                    </tr>
                  )}
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

      {/* Right Panel - Form (inline card như Vocabularies) */}
      {showModal && (
        <div className="card" style={{ width: '800px', marginLeft: '10px', overflowY: 'auto' }}>
          <div className="card-header d-flex align-items-center">
            <h4 className="card-title mb-0" style={{ flex: 1 }}>
              {editingTopic ? 'Edit topic' : 'Add a new topic'}
            </h4>
            <div className="d-flex" style={{ gap: '8px', marginLeft: 'auto' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setEditingTopic(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" form="topic-form" className="btn btn-sm btn-primary">
                Save
              </button>
            </div>
          </div>
          <div className="card-body">
            <form id="topic-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div style={{ flex: '0 0 60%', maxWidth: '60%', paddingRight: '15px' }}>
                  <div className="form-group">
                    <label>Topic Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Enter topic name"
                    />
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
                        backgroundImage: `url(${formData.image || DEFAULT_IMAGE})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1px solid #ced4da',
                        borderRadius: '0.375rem',
                      }}
                      onClick={() => document.getElementById('image-file-input')?.click()}
                      title="Click to select image"
                    >
                      {!formData.image && <span className="text-muted">Select Image</span>}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="d-none"
                      id="image-file-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Order</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                  placeholder="Display order"
                />
                <small className="text-muted">Lower numbers appear first</small>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description (optional)"
                />
              </div>

              {/* Language Fields - Translations */}
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
                          {lang.flag && lang.flag.startsWith('http') ? (
                            <img src={lang.flag} alt={lang.name} style={{ width: '28px', height: '21px', objectFit: 'cover', borderRadius: '3px' }} />
                          ) : (
                            <span style={{ fontSize: '1.2rem', lineHeight: '1', minWidth: '28px', textAlign: 'center' }}>{lang.flag}</span>
                          )}
                          <span className="text-muted" style={{ fontWeight: '500' }}>{lang.nativeName}</span>
                          <span className="badge badge-info">{lang.code}</span>
                          <span className="text-muted" style={{ fontWeight: '500' }}>{lang.name}</span>
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
                                    className="btn btn-sm btn-outline-primary"
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
                                  />
                                  {trans.audioUrl ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-success mb-0"
                                      title="Play / Stop audio"
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
                                      <i className="fas fa-play"></i>
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
                    id="isActiveSwitch"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <label className="custom-control-label" htmlFor="isActiveSwitch">
                    Active
                  </label>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
