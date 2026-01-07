import { useEffect, useState } from 'react';
import api from '../config/api';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const DEFAULT_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"80\"%3E%3Crect width=\"120\" height=\"80\" fill=\"%23f0f0f0\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" text-anchor=\"middle\" dy=\".3em\" fill=\"%23999\" font-size=\"12\"%3ENo Image%3C/text%3E%3C/svg%3E';

interface Topic {
  id: string;
  name: string;
  description: string;
  image: string | null;
  isActive: boolean;
  sourceLanguage?: Language;
  targetLanguage?: Language;
  createdAt: string;
}

export default function Topics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    sourceLanguageId: '',
    targetLanguageId: '',
    isActive: true,
  });

  useEffect(() => {
    fetchLanguages();
    fetchTopics();
  }, []);

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
      const response = await api.get('/topics');
      setTopics(response.data.topics);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTopic(null);
    setFormData({ 
      name: '', 
      description: '', 
      image: '', 
      sourceLanguageId: '',
      targetLanguageId: '',
      isActive: true 
    });
    setShowModal(true);
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({
      name: topic.name,
      description: topic.description || '',
      image: topic.image || '',
      sourceLanguageId: topic.sourceLanguage?.id || '',
      targetLanguageId: topic.targetLanguage?.id || '',
      isActive: topic.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chủ đề này?')) return;

    try {
      await api.delete(`/topics/${id}`);
      fetchTopics();
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Xóa chủ đề thất bại');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert empty strings to null for UUID fields
      const payload = {
        ...formData,
        sourceLanguageId: formData.sourceLanguageId && formData.sourceLanguageId.trim() !== '' 
          ? formData.sourceLanguageId 
          : null,
        targetLanguageId: formData.targetLanguageId && formData.targetLanguageId.trim() !== '' 
          ? formData.targetLanguageId 
          : null,
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
      const errorMessage = error.response?.data?.message || error.message || 'Lưu chủ đề thất bại';
      alert(errorMessage);
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

  const filteredTopics = topics.filter((topic) => {
    if (!searchTerm.trim()) return true;
    const keyword = searchTerm.trim().toLowerCase();
    return (
      topic.name.toLowerCase().includes(keyword) ||
      (topic.description && topic.description.toLowerCase().includes(keyword))
    );
  });

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title mb-0">Danh sách chủ đề</h3>
          <div className="card-tools d-flex align-items-center" style={{ gap: '8px' }}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Tìm theo tên hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '260px' }}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleCreate}
            >
              <i className="fas fa-plus mr-1"></i>
              Thêm chủ đề
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>No</th>
                  <th style={{ width: '90px' }}>Ảnh</th>
                  <th>Tên chủ đề</th>
                  <th style={{ width: '200px' }}>Ngôn ngữ</th>
                  <th style={{ width: '110px' }}>Trạng thái</th>
                  <th style={{ width: '90px' }}>Edit</th>
                  <th style={{ width: '90px' }}>Delete</th>
                </tr>
              </thead>
              <tbody>
                {filteredTopics.map((topic, index) => (
                  <tr key={topic.id}>
                    <td>{index + 1}</td>
                    <td>
                      <img
                        src={topic.image || DEFAULT_IMAGE}
                        alt={topic.name}
                        style={{
                          width: '60px',
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
                          style={{ maxWidth: '260px' }}
                          title={topic.description}
                        >
                          {topic.description}
                        </div>
                      )}
                    </td>
                    <td>
                      {(topic.sourceLanguage || topic.targetLanguage) ? (
                        <div className="small">
                          {topic.sourceLanguage && (
                            <span className="badge badge-info mr-1">
                              {topic.sourceLanguage.flag} {topic.sourceLanguage.nativeName}
                            </span>
                          )}
                          {topic.sourceLanguage && topic.targetLanguage && (
                            <i className="fas fa-arrow-right mx-1"></i>
                          )}
                          {topic.targetLanguage && (
                            <span className="badge badge-success">
                              {topic.targetLanguage.flag} {topic.targetLanguage.nativeName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted small">Chưa cấu hình</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${topic.isActive ? 'badge-success' : 'badge-secondary'}`}
                      >
                        {topic.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
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
                    <td colSpan={7} className="text-center py-4 text-muted">
                      Chưa có chủ đề nào
                    </td>
                  </tr>
                )}
                {topics.length > 0 && filteredTopics.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      Không tìm thấy chủ đề phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">
                  {editingTopic ? 'Sửa chủ đề' : 'Thêm chủ đề mới'}
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
                    <label>Tên chủ đề *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mô tả</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>URL hình ảnh</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Ngôn ngữ nguồn</label>
                        <select
                          className="form-control"
                          value={formData.sourceLanguageId}
                          onChange={(e) => setFormData({ ...formData, sourceLanguageId: e.target.value })}
                        >
                          <option value="">Chọn ngôn ngữ nguồn</option>
                          {languages.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                              {lang.flag} {lang.nativeName} ({lang.name})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Ngôn ngữ đích</label>
                        <select
                          className="form-control"
                          value={formData.targetLanguageId}
                          onChange={(e) => setFormData({ ...formData, targetLanguageId: e.target.value })}
                        >
                          <option value="">Chọn ngôn ngữ đích</option>
                          {languages.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                              {lang.flag} {lang.nativeName} ({lang.name})
                            </option>
                          ))}
                        </select>
                      </div>
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
