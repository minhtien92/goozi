import { useEffect, useState } from 'react';
import api from '../config/api';

interface HomeSetting {
  id: string;
  key: string;
  value: string;
  order: number;
  isActive: boolean;
}

export default function Slogan() {
  const [slogans, setSlogans] = useState<HomeSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Form thêm mới
  const [newSloganValues, setNewSloganValues] = useState<string[]>(Array(13).fill(''));
  const [wordSearch, setWordSearch] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/home-settings');
      const allSettings = response.data.settings;
      
      // Get slogans
      const sloganSettings = allSettings.filter((s: HomeSetting) => s.key === 'slogan');
      sloganSettings.sort((a: HomeSetting, b: HomeSetting) => a.order - b.order);
      setSlogans(sloganSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index: number) => {
    const slogan = slogans[index];
    if (slogan) {
      setEditingIndex(index);
      setEditValue(slogan.value);
    }
  };

  const handleSaveEdit = async () => {
    if (editingIndex === null) return;
    
    const slogan = slogans[editingIndex];
    if (!slogan) return;

    try {
      await api.put(`/home-settings/${slogan.id}`, {
        value: editValue.trim(),
        isActive: editValue.trim() !== '',
      });
      alert('Cập nhật slogan thành công!');
      setEditingIndex(null);
      setEditValue('');
      fetchSettings();
    } catch (error: any) {
      console.error('Error updating slogan:', error);
      alert('Cập nhật slogan thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleDeleteSlogan = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa slogan này?')) return;

    try {
      await api.delete(`/home-settings/${id}`);
      alert('Xóa slogan thành công!');
      fetchSettings();
    } catch (error) {
      console.error('Error deleting slogan:', error);
      alert('Xóa slogan thất bại');
    }
  };

  const handleNewSloganChange = (index: number, value: string) => {
    const newValues = [...newSloganValues];
    newValues[index] = value;
    setNewSloganValues(newValues);
  };

  const handleAddNewSlogan = async () => {
    // Lấy giá trị từ Language 1 (English) làm giá trị chính
    const englishValue = newSloganValues[0]?.trim();
    
    if (!englishValue) {
      alert('Vui lòng nhập slogan (Language 1 - English)');
      return;
    }

    try {
      // Tìm order tiếp theo
      let maxOrder = 0;
      if (slogans.length > 0) {
        const orders = slogans.map(s => s.order || 0);
        maxOrder = Math.max(...orders) + 1;
      }

      // Tạo slogan mới với giá trị English (luôn tạo mới, không update)
      const response = await api.post('/home-settings/create', {
        key: 'slogan',
        value: englishValue,
        order: maxOrder,
        isActive: true,
      });

      if (response.data) {
        alert('Thêm slogan thành công!');
        // Reset form
        setNewSloganValues(Array(13).fill(''));
        setWordSearch('');
        fetchSettings();
      }
    } catch (error: any) {
      console.error('Error adding slogan:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Lỗi không xác định';
      alert('Thêm slogan thất bại: ' + errorMessage);
    }
  };

  const filteredSlogans = slogans.filter((slogan) =>
    slogan.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="d-flex" style={{ height: 'calc(100vh - 100px)', gap: '10px' }}>
      {/* Left Panel - Slogan List */}
      <div className="flex-fill" style={{ overflowY: 'auto' }}>
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search..."
                style={{ width: '200px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>No</th>
                    <th>English</th>
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSlogans.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center text-muted">
                        Không có slogan nào
                      </td>
                    </tr>
                  ) : (
                    filteredSlogans.map((slogan, index) => (
                      <tr key={slogan.id}>
                        <td>{index + 1}</td>
                        <td>
                          {editingIndex === index ? (
                            <input
                              type="text"
                              className="form-control"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit();
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span>{slogan.value}</span>
                          )}
                        </td>
                        <td>
                          {editingIndex === index ? (
                            <div className="d-flex" style={{ gap: '5px' }}>
                              <button
                                onClick={handleSaveEdit}
                                className="btn btn-sm btn-success"
                                title="Save"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="btn btn-sm btn-secondary"
                                title="Cancel"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ) : (
                            <div className="d-flex" style={{ gap: '5px' }}>
                              <button
                                onClick={() => handleEdit(index)}
                                className="btn btn-sm btn-primary"
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                onClick={() => handleDeleteSlogan(slogan.id)}
                                className="btn btn-sm btn-danger"
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Add New Slogan Form */}
      <div className="card" style={{ width: '400px' }}>
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="card-title mb-0">
            <i className="fas fa-plus mr-2"></i>
            Add a new slogan
          </h4>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleAddNewSlogan}
          >
            <i className="fas fa-save mr-1"></i>
            Save
          </button>
        </div>
        <div className="card-body" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
          <div className="form-group">
            <label>Word</label>
            <div className="d-flex align-items-center gap-2 mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={wordSearch}
                onChange={(e) => setWordSearch(e.target.value)}
              />
            </div>
          </div>
          
          {/* Language inputs - 13 languages */}
          {Array.from({ length: 13 }, (_, i) => (
            <div key={i} className="form-group">
              <label>Language {i + 1}</label>
              <input
                type="text"
                className="form-control"
                placeholder={`Enter slogan in language ${i + 1}`}
                value={newSloganValues[i]}
                onChange={(e) => handleNewSloganChange(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
