import { useEffect, useState } from 'react';
import api from '../config/api';

interface Testimonial {
  id: string;
  name: string;
  quote: string;
  order: number;
  isActive: boolean;
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuote, setEditQuote] = useState('');
  const [editOrder, setEditOrder] = useState(0);
  
  // Form thêm mới
  const [newName, setNewName] = useState('');
  const [newQuote, setNewQuote] = useState('');
  const [newOrder, setNewOrder] = useState(0);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await api.get('/testimonials');
      const sorted = response.data.testimonials.sort((a: Testimonial, b: Testimonial) => 
        a.order - b.order
      );
      setTestimonials(sorted);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setEditName(testimonial.name);
    setEditQuote(testimonial.quote);
    setEditOrder(testimonial.order || 0);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      await api.put(`/testimonials/${editingId}`, {
        name: editName.trim(),
        quote: editQuote.trim(),
        order: editOrder,
      });
      alert('Cập nhật testimonial thành công!');
      setEditingId(null);
      setEditName('');
      setEditQuote('');
      setEditOrder(0);
      fetchTestimonials();
    } catch (error: any) {
      console.error('Error updating testimonial:', error);
      alert('Cập nhật testimonial thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditQuote('');
    setEditOrder(0);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa testimonial này?')) return;

    try {
      await api.delete(`/testimonials/${id}`);
      alert('Xóa testimonial thành công!');
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      alert('Xóa testimonial thất bại');
    }
  };

  const handleCreate = () => {
    setShowModal(true);
    setNewName('');
    setNewQuote('');
    setNewOrder(0);
  };

  const handleCancelNew = () => {
    setShowModal(false);
    setNewName('');
    setNewQuote('');
    setNewOrder(0);
  };

  const handleAddNew = async () => {
    if (!newName.trim() || !newQuote.trim()) {
      alert('Vui lòng nhập đầy đủ tên và quote');
      return;
    }

    try {
      await api.post('/testimonials', {
        name: newName.trim(),
        quote: newQuote.trim(),
        order: newOrder,
        isActive: true,
      });
      alert('Thêm testimonial thành công!');
      setShowModal(false);
      setNewName('');
      setNewQuote('');
      setNewOrder(0);
      fetchTestimonials();
    } catch (error: any) {
      console.error('Error adding testimonial:', error);
      alert('Thêm testimonial thất bại: ' + (error.response?.data?.message || error.message));
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
    <div className="d-flex" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Left Panel - Testimonials List */}
      <div className="flex-fill" style={{ overflowY: 'auto', paddingRight: '10px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title mb-0">Quản lý Testimonials</h3>
            <div className="card-tools">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleCreate}
              >
                <i className="fas fa-plus mr-1"></i>
                Thêm Testimonial
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-striped table-hover mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>No</th>
                    <th style={{ width: '80px' }}>Order</th>
                    <th>Name</th>
                    <th>Quote</th>
                    <th style={{ width: '200px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">
                        Chưa có testimonial nào
                      </td>
                    </tr>
                  ) : (
                    testimonials.map((testimonial, index) => (
                      <tr key={testimonial.id}>
                        <td>{index + 1}</td>
                        <td>
                          {editingId === testimonial.id ? (
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              style={{ width: '60px' }}
                              value={editOrder}
                              onChange={(e) => setEditOrder(parseInt(e.target.value) || 0)}
                            />
                          ) : (
                            <span>{testimonial.order}</span>
                          )}
                        </td>
                        <td>
                          {editingId === testimonial.id ? (
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          ) : (
                            <span>{testimonial.name}</span>
                          )}
                        </td>
                        <td>
                          {editingId === testimonial.id ? (
                            <textarea
                              className="form-control form-control-sm"
                              value={editQuote}
                              onChange={(e) => setEditQuote(e.target.value)}
                              rows={2}
                            />
                          ) : (
                            <span>{testimonial.quote}</span>
                          )}
                        </td>
                        <td>
                          {editingId === testimonial.id ? (
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
                                onClick={() => handleEdit(testimonial)}
                                className="btn btn-sm btn-primary"
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                onClick={() => handleDelete(testimonial.id)}
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

      {/* Right Panel - Add New Form */}
      {showModal && (
        <div className="card" style={{ width: '800px', marginLeft: '10px', overflowY: 'auto' }}>
          <div className="card-header d-flex align-items-center">
            <h4 className="card-title mb-0" style={{ flex: 1 }}>
              Thêm Testimonial mới
            </h4>
            <div className="d-flex" style={{ gap: '8px', marginLeft: 'auto' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleCancelNew}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleAddNew}
              >
                Lưu
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nhập tên"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Quote *</label>
              <textarea
                className="form-control"
                placeholder="Nhập quote"
                rows={4}
                value={newQuote}
                onChange={(e) => setNewQuote(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Order</label>
              <input
                type="number"
                className="form-control"
                placeholder="Thứ tự hiển thị"
                value={newOrder}
                onChange={(e) => setNewOrder(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

