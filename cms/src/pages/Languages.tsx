import { useEffect, useState } from 'react';
import api from '../config/api';

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
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nativeName: '',
    flag: '',
    isActive: true,
  });

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const response = await api.get('/languages');
      setLanguages(response.data.languages);
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
    if (!confirm('Bạn có chắc chắn muốn xóa ngôn ngữ này?')) return;

    try {
      await api.delete(`/languages/${id}`);
      fetchLanguages();
    } catch (error) {
      console.error('Error deleting language:', error);
      alert('Xóa ngôn ngữ thất bại');
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
      alert('Lưu ngôn ngữ thất bại');
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
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Danh sách ngôn ngữ</h3>
          <div className="card-tools">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleCreate}
            >
              <i className="fas fa-plus mr-1"></i>
              Thêm ngôn ngữ
            </button>
          </div>
        </div>
        <div className="card-body">
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th style={{ width: '10px' }}>#</th>
                <th>Flag</th>
                <th>Code</th>
                <th>Tên</th>
                <th>Tên bản địa</th>
                <th>Trạng thái</th>
                <th style={{ width: '150px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {languages.map((language, index) => (
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
                      {language.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleEdit(language)}
                      className="btn btn-sm btn-primary mr-1"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(language.id)}
                      className="btn btn-sm btn-danger"
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

      {showModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">
                  {editingLanguage ? 'Sửa ngôn ngữ' : 'Thêm ngôn ngữ mới'}
                </h4>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
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
                    <label>Tên *</label>
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
                    <label>Tên bản địa</label>
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
                        Hoạt động
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer justify-content-between">
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
        </div>
      )}
      {showModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
}
