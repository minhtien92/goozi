import { useEffect, useState } from 'react';
import api from '../config/api';
import Pagination from '../components/Pagination';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  });
  const [, setEditName] = useState('');
  const [, setEditQuote] = useState('');
  const [, setEditOrder] = useState(0);
  
  // Form thêm mới
  const [newName, setNewName] = useState('');
  const [newQuote, setNewQuote] = useState('');
  const [newOrder, setNewOrder] = useState(0);

  useEffect(() => {
    fetchTestimonials();
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
        if (isLargeScreen && !editingId && !showModal) {
          setNewName('');
          setNewQuote('');
          setNewOrder(0);
          setShowModal(true);
        }
        isInitialMount = false;
      } else {
        // On resize, handle transitions
        if (isLargeScreen && !editingId && !showModal) {
          // Resize from small to large: auto open
          setNewName('');
          setNewQuote('');
          setNewOrder(0);
          setShowModal(true);
        } else if (!isLargeScreen && wasLargeScreen && showModal && !editingId) {
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
  }, [loading, editingId]);

  const fetchTestimonials = async () => {
    try {
      const response = await api.get('/testimonials', {
        params: { page: currentPage, limit: 10 },
      });
      const sorted = response.data.testimonials.sort((a: Testimonial, b: Testimonial) => 
        a.order - b.order
      );
      setTestimonials(sorted);
      setPagination(response.data.pagination);
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
    // Fill form in right panel with testimonial data
    setNewName(testimonial.name);
    setNewQuote(testimonial.quote);
    setNewOrder(testimonial.order || 0);
    setShowModal(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditQuote('');
    setEditOrder(0);
    setNewName('');
    setNewQuote('');
    setNewOrder(0);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      await api.delete(`/testimonials/${id}`);
      alert('Testimonial deleted successfully!');
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      alert('Failed to delete testimonial');
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setEditName('');
    setEditQuote('');
    setEditOrder(0);
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
      alert('Please enter both name and quote');
      return;
    }

    try {
      if (editingId) {
        // Update existing testimonial
        await api.put(`/testimonials/${editingId}`, {
          name: newName.trim(),
          quote: newQuote.trim(),
          order: newOrder,
        });
        alert('Testimonial updated successfully!');
        setEditingId(null);
      } else {
        // Create new testimonial
        await api.post('/testimonials', {
          name: newName.trim(),
          quote: newQuote.trim(),
          order: newOrder,
          isActive: true,
        });
        alert('Testimonial added successfully!');
      }
      setShowModal(false);
      setNewName('');
      setNewQuote('');
      setNewOrder(0);
      setEditName('');
      setEditQuote('');
      setEditOrder(0);
      fetchTestimonials();
    } catch (error: any) {
      console.error('Error saving testimonial:', error);
      alert('Failed to save testimonial: ' + (error.response?.data?.message || error.message));
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
      {/* Left Panel - Testimonials List */}
      <div className="flex-fill" style={{ overflowY: 'auto', paddingRight: '10px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title mb-0">Testimonial Management</h3>
            <div className="card-tools">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleCreate}
              >
                <i className="fas fa-plus mr-1"></i>
                Add Testimonial
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
                        No testimonials yet
                      </td>
                    </tr>
                  ) : (
                    testimonials.map((testimonial, index) => (
                      <tr key={testimonial.id}>
                        <td>{index + 1}</td>
                        <td>
                          <span>{testimonial.order}</span>
                        </td>
                        <td>
                          <span>{testimonial.name}</span>
                        </td>
                        <td>
                          <span>{testimonial.quote}</span>
                        </td>
                        <td>
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
                        </td>
                      </tr>
                    ))
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

      {/* Right Panel - Add/Edit Form */}
      {showModal && (
        <div className="card" style={{ width: '800px', marginLeft: '10px', overflowY: 'auto' }}>
          <div className="card-header d-flex align-items-center">
            <h4 className="card-title mb-0" style={{ flex: 1 }}>
              {editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
            </h4>
            <div className="d-flex" style={{ gap: '8px', marginLeft: 'auto' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={editingId ? handleCancelEdit : handleCancelNew}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleAddNew}
              >
                {editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Quote *</label>
              <textarea
                className="form-control"
                placeholder="Enter quote"
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
                placeholder="Display order"
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

