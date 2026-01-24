import { useEffect, useState } from 'react';
import api, { uploadFile } from '../config/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  order: number | null;
  isActive: boolean;
  createdAt: string;
}

export default function Languages() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nativeName: '',
    flag: '',
    order: '',
    isActive: true,
  });

  useEffect(() => {
    fetchLanguages();
  }, []);

  // Auto open/close form based on screen size
  useEffect(() => {
    if (loading) return; // Wait for data to load

    let previousWidth = window.innerWidth;
    let isInitialMount = true;

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const isLargeScreen = currentWidth > 1500;
      const wasLargeScreen = previousWidth > 1500;

      if (isInitialMount) {
        // On initial mount, only auto-open on large screens
        if (isLargeScreen && !editingLanguage && !showModal) {
          const maxOrder = languages.length > 0 
            ? Math.max(...languages.map(l => l.order || 0)) + 1 
            : 1;
          setFormData({ code: '', name: '', nativeName: '', flag: '', order: maxOrder.toString(), isActive: true });
          setShowModal(true);
        }
        isInitialMount = false;
      } else {
        // On resize, handle transitions
        if (isLargeScreen && !editingLanguage && !showModal) {
          // Resize from small to large: auto open
          const maxOrder = languages.length > 0 
            ? Math.max(...languages.map(l => l.order || 0)) + 1 
            : 1;
          setFormData({ code: '', name: '', nativeName: '', flag: '', order: maxOrder.toString(), isActive: true });
          setShowModal(true);
        } else if (!isLargeScreen && wasLargeScreen && showModal && !editingLanguage) {
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
  }, [loading, editingLanguage]);

  const fetchLanguages = async () => {
    try {
      const response = await api.get('/languages');
      const sorted = response.data.languages.sort((a: Language, b: Language) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderB - orderA; // Descending: high to low
      });
      setLanguages(sorted);
    } catch (error) {
      console.error('Error fetching languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLanguage(null);
    const maxOrder = languages.length > 0 
      ? Math.max(...languages.map(l => l.order || 0)) + 1 
      : 1;
    setFormData({ code: '', name: '', nativeName: '', flag: '', order: maxOrder.toString(), isActive: true });
    setShowModal(true);
  };

  const handleEdit = (language: Language) => {
    setEditingLanguage(language);
    setFormData({
      code: language.code,
      name: language.name,
      nativeName: language.nativeName || '',
      flag: language.flag || '',
      order: language.order?.toString() || '',
      isActive: language.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this language?')) return;

    try {
      await api.delete(`/languages/${id}`);
      fetchLanguages();
    } catch (error) {
      console.error('Error deleting language:', error);
      alert('Failed to delete language');
    }
  };

  const handleFlagUpload = async (file: File) => {
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
        
        console.log('Upload flag - fullUrl:', fullUrl);
        
        setFormData({ ...formData, flag: fullUrl });
      }
    } catch (error: any) {
      console.error('Error uploading flag:', error);
      alert('Failed to upload flag: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        order: formData.order ? parseInt(formData.order) : null,
      };
      if (editingLanguage) {
        await api.put(`/languages/${editingLanguage.id}`, payload);
      } else {
        await api.post('/languages', payload);
      }
      setShowModal(false);
      fetchLanguages();
    } catch (error) {
      console.error('Error saving language:', error);
      alert('Failed to save language');
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(languages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLanguages(items);
  };

  const handleSaveOrder = async () => {
    const orderData = languages.map((lang, index) => ({ id: lang.id, order: index }));
    try {
      await api.post('/languages/order', orderData);
      alert('Order saved successfully');
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save order');
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
      {/* Left Panel - Language List */}
      <div className="flex-fill" style={{ overflowY: 'auto', paddingRight: '10px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title mb-0">Language List</h3>
            <div className="card-tools d-flex align-items-center" style={{ gap: '10px' }}>
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
                className="btn btn-success btn-sm"
                onClick={handleSaveOrder}
              >
                <i className="fas fa-save mr-1"></i>
                Save Order
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleCreate}
              >
                <i className="fas fa-plus mr-1"></i>
                Add Language
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="table-responsive">
                <table className="table table-bordered table-striped table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Flag</th>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Native Name</th>
                      <th>Status</th>
                      <th style={{ width: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <Droppable droppableId="languages">
                    {(provided: any) => (
                      <tbody {...provided.droppableProps} ref={provided.innerRef}>
                        {languages
                          .filter((language) => {
                            if (!searchTerm.trim()) return true;
                            const keyword = searchTerm.trim().toLowerCase();
                            return (
                              language.code.toLowerCase().includes(keyword) ||
                              language.name.toLowerCase().includes(keyword) ||
                              (language.nativeName && language.nativeName.toLowerCase().includes(keyword))
                            );
                          })
                          .map((language, index) => (
                            <Draggable key={language.id} draggableId={language.id} index={index}>
                              {(provided: any) => (
                                <tr
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <td>{language.order ?? '-'}</td>
                                  <td className="text-center">
                                    {language.flag && language.flag.startsWith('http') ? (
                                      <img
                                        src={language.flag}
                                        alt={language.name}
                                        style={{
                                          width: '32px',
                                          height: '24px',
                                          objectFit: 'cover',
                                          borderRadius: '4px',
                                        }}
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const fallback = document.createElement('span');
                                          fallback.textContent = language.flag || '🏳️';
                                          fallback.style.fontSize = '24px';
                                          target.parentElement?.appendChild(fallback);
                                        }}
                                      />
                                    ) : (
                                      <span style={{ fontSize: '24px' }}>{language.flag || '🏳️'}</span>
                                    )}
                                  </td>
                                  <td>
                                    <span className="badge badge-info">{language.code}</span>
                                  </td>
                                  <td>{language.name}</td>
                                  <td>{language.nativeName}</td>
                                  <td>
                                    <span className={`badge ${language.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                      {language.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td>
                                    <button
                                      onClick={() => handleEdit(language)}
                                      className="btn btn-sm btn-success mr-1"
                                      title="Edit"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                      onClick={() => handleDelete(language.id)}
                                      className="btn btn-sm btn-danger"
                                      title="Delete"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </tbody>
                    )}
                  </Droppable>
                </table>
              </div>
            </DragDropContext>
          </div>
        </div>
      </div>

      {/* Right Panel - Form (inline card như Vocabularies và Topics) */}
      {showModal && (
        <div className="card" style={{ width: '800px', marginLeft: '10px', overflowY: 'auto' }}>
          <div className="card-header d-flex align-items-center">
            <h4 className="card-title mb-0" style={{ flex: 1 }}>
              {editingLanguage ? 'Edit Language' : 'Add New Language'}
            </h4>
            <div className="d-flex" style={{ gap: '8px', marginLeft: 'auto' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setEditingLanguage(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" form="language-form" className="btn btn-sm btn-primary">
                Save
              </button>
            </div>
          </div>
          <div className="card-body">
            <form id="language-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Code *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="vi, en, ja, ko..."
                />
              </div>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Vietnamese, English..."
                />
              </div>
              <div className="form-group">
                <label>Native Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.nativeName}
                  onChange={(e) => setFormData({ ...formData, nativeName: e.target.value })}
                  placeholder="Tiếng Việt, English, 日本語..."
                />
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
                <label>Flag</label>
                <div className="d-flex align-items-center" style={{ gap: '10px' }}>
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: '80px',
                      height: '80px',
                      cursor: 'pointer',
                      backgroundImage: formData.flag && formData.flag.startsWith('http') 
                        ? `url(${formData.flag})` 
                        : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid #ced4da',
                      borderRadius: '0.375rem',
                      backgroundColor: '#f8f9fa',
                    }}
                    onClick={() => document.getElementById('flag-file-input')?.click()}
                    title="Click to upload flag image"
                  >
                    {!formData.flag || !formData.flag.startsWith('http') ? (
                      <div className="text-center">
                        {formData.flag ? (
                          <span style={{ fontSize: '32px' }}>{formData.flag}</span>
                        ) : (
                          <span className="text-muted small">Upload</span>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex-fill">
                    <input
                      type="text"
                      className="form-control"
                      value={formData.flag}
                      onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                      placeholder="🇻🇳, 🇺🇸, 🇯🇵 or image URL"
                    />
                    <small className="text-muted">Enter emoji or upload image</small>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="d-none"
                    id="flag-file-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFlagUpload(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="custom-control custom-switch">
                  <input
                    type="checkbox"
                    className="custom-control-input"
                    id="langActiveSwitch"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <label className="custom-control-label" htmlFor="langActiveSwitch">
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
