import { useEffect, useState } from 'react';
import api from '../config/api';

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

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Danh sách chủ đề</h3>
          <div className="card-tools">
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
          <div className="row p-3">
            {topics.map((topic) => (
              <div key={topic.id} className="col-md-4 mb-3">
                <div className="card card-primary card-outline">
                  {topic.image && (
                    <img
                      src={topic.image}
                      alt={topic.name}
                      className="card-img-top"
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{topic.name}</h5>
                    <p className="card-text text-sm">{topic.description}</p>
                    {(topic.sourceLanguage || topic.targetLanguage) && (
                      <div className="mb-2">
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
                    )}
                    <div className="d-flex justify-content-between align-items-center">
                      <span className={`badge ${topic.isActive ? 'badge-success' : 'badge-secondary'}`}>
                        {topic.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                      <div>
                        <button
                          onClick={() => handleEdit(topic)}
                          className="btn btn-sm btn-primary mr-1"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(topic.id)}
                          className="btn btn-sm btn-danger"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {topics.length === 0 && (
            <div className="text-center py-5">
              <p className="text-muted">Chưa có chủ đề nào</p>
            </div>
          )}
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
