import { useEffect, useState } from 'react';
import api from '../config/api';
import Pagination from '../components/Pagination';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isActive: boolean;
  createdAt: string;
}

export default function Languages() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  });
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nativeName: '',
    flag: '',
    isActive: true,
  });

  useEffect(() => {
    fetchLanguages();
  }, [currentPage]);

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
          setFormData({ code: '', name: '', nativeName: '', flag: '', isActive: true });
          setShowModal(true);
        }
        isInitialMount = false;
      } else {
        // On resize, handle transitions
        if (isLargeScreen && !editingLanguage && !showModal) {
          // Resize from small to large: auto open
          setFormData({ code: '', name: '', nativeName: '', flag: '', isActive: true });
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
      const response = await api.get('/languages', {
        params: { page: currentPage, limit: 10 },
      });
      setLanguages(response.data.languages);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLanguage(null);
    setFormData({ code: '', name: '', nativeName: '', flag: '', isActive: true });
    setShowModal(true);
  };

  const handleEdit = (language: Language) => {
    setEditingLanguage(language);
    setFormData({
      code: language.code,
      name: language.name,
      nativeName: language.nativeName || '',
      flag: language.flag || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingLanguage) {
        await api.put(`/languages/${editingLanguage.id}`, formData);
      } else {
        await api.post('/languages', formData);
      }
      setShowModal(false);
      fetchLanguages();
    } catch (error) {
      console.error('Error saving language:', error);
      alert('Failed to save language');
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
                className="btn btn-primary btn-sm"
                onClick={handleCreate}
              >
                <i className="fas fa-plus mr-1"></i>
                Add Language
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '10px' }}>#</th>
                    <th>Flag</th>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Native Name</th>
                    <th>Status</th>
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
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
                    <tr key={language.id}>
                      <td>{index + 1}</td>
                      <td className="text-center" style={{ fontSize: '24px' }}>
                        {language.flag}
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
                <label>Flag (Emoji)</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.flag}
                  onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                  placeholder="🇻🇳, 🇺🇸, 🇯🇵..."
                />
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
