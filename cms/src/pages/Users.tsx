import { useEffect, useState } from 'react';
import api from '../config/api';
import Pagination from '../components/Pagination';

interface Permissions {
  topics?: boolean;
  vocabularies?: boolean;
  home?: boolean;
  users?: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  permissions?: Permissions;
}

export default function Users({ mode = 'all' }: { mode?: 'all' | 'admin' | 'learner' }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [adminSearch, setAdminSearch] = useState('');
  const [learnerSearch, setLearnerSearch] = useState('');
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    password: '',
    permissions: {
      topics: true,
      vocabularies: true,
      home: true,
      users: true,
    } as Permissions,
  });

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users', {
        params: { page: currentPage, limit: 10 },
      });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      permissions: {
        topics: user.permissions?.topics ?? false,
        vocabularies: user.permissions?.vocabularies ?? false,
        home: user.permissions?.home ?? false,
        users: user.permissions?.users ?? false,
      },
    });
    setShowModal(true);
  };

  const handleCreate = (role: 'admin' | 'user') => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role,
      password: '',
      permissions: {
        topics: true,
        vocabularies: true,
        home: true,
        users: true,
      },
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // update existing
        const payload: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          permissions: formData.role === 'admin' ? formData.permissions : undefined,
        };
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        // create new
        const payload: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password,
        };
        if (formData.role === 'admin') {
          payload.permissions = formData.permissions;
        }
        await api.post('/users', payload);
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user');
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

  const adminUsers = users.filter((u) => u.role === 'admin');
  const learnerUsers = users.filter((u) => u.role !== 'admin');
  const visibleAdminUsers = adminUsers;
  const visibleLearnerUsers = learnerUsers;

  const filterByKeyword = (data: User[], keyword: string) => {
    if (!keyword.trim()) return data;
    const q = keyword.trim().toLowerCase();
    return data.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
    );
  };

  const renderTable = (
    data: User[],
    title: string,
    emptyText: string,
    opts: { isAdminTable: boolean; keyword: string; onSearch: (v: string) => void }
  ) => {
    const filteredData = filterByKeyword(data, opts.keyword);
    const showCreateButton = opts.isAdminTable && (mode === 'all' || mode === 'admin');
    const createLabel = opts.isAdminTable ? 'Add new admin' : '';

    return (
    <div className="card mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="card-title mb-0">{title}</h3>
        <div className="card-tools">
            <div className="input-group input-group-sm mr-2" style={{ width: '220px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or email"
                value={opts.keyword}
                onChange={(e) => opts.onSearch(e.target.value)}
              />
              <div className="input-group-append">
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
              </div>
            </div>
            {showCreateButton && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleCreate('admin')}
              >
                <i className="fas fa-plus mr-1"></i> {createLabel}
              </button>
            )}
        </div>
      </div>
      <div className="card-body">
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th style={{ width: '10px' }}>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created Date</th>
              <th>Permissions</th>
              <th style={{ width: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-secondary'}`}>
                    {user.role === 'admin' ? 'Admin' : 'Learner'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>
                  {user.role === 'admin' ? (
                    <div className="small">
                      <span className="badge badge-light border mr-1">Topic</span>
                      <span className="badge badge-light border mr-1">Vocab</span>
                      <span className="badge badge-light border mr-1">Web/Home</span>
                      <span className="badge badge-light border">Users</span>
                    </div>
                  ) : (
                    <span className="text-muted small">N/A</span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => handleEdit(user)}
                    className="btn btn-sm btn-primary mr-1"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="btn btn-sm btn-danger"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    );
  };

  return (
    <div>
      {(mode === 'all' || mode === 'admin') &&
        renderTable(visibleAdminUsers, 'Quản lý user admin', 'Chưa có admin', {
          isAdminTable: true,
          keyword: adminSearch,
          onSearch: setAdminSearch,
        })}
      {(mode === 'all' || mode === 'learner') &&
        renderTable(visibleLearnerUsers, 'Quản lý user người học', 'Chưa có người học', {
          isAdminTable: false,
          keyword: learnerSearch,
          onSearch: setLearnerSearch,
        })}
      <div className="card">
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

      {showModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">{editingUser ? 'Edit User' : 'Add User'}</h4>
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
                    <label>Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  {!editingUser && (
                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      className="form-control"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {formData.role === 'admin' && (
                    <div className="form-group">
                      <label>Admin Permissions</label>
                      <div className="d-flex flex-wrap" style={{ gap: '8px' }}>
                        <div className="custom-control custom-checkbox">
                          <input
                            type="checkbox"
                            className="custom-control-input"
                            id="perm-topics"
                            checked={!!formData.permissions.topics}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permissions: { ...formData.permissions, topics: e.target.checked },
                              })
                            }
                          />
                          <label className="custom-control-label" htmlFor="perm-topics">
                            Topics
                          </label>
                        </div>
                        <div className="custom-control custom-checkbox">
                          <input
                            type="checkbox"
                            className="custom-control-input"
                            id="perm-vocab"
                            checked={!!formData.permissions.vocabularies}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permissions: { ...formData.permissions, vocabularies: e.target.checked },
                              })
                            }
                          />
                          <label className="custom-control-label" htmlFor="perm-vocab">
                            Vocabulary
                          </label>
                        </div>
                        <div className="custom-control custom-checkbox">
                          <input
                            type="checkbox"
                            className="custom-control-input"
                            id="perm-home"
                            checked={!!formData.permissions.home}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permissions: { ...formData.permissions, home: e.target.checked },
                              })
                            }
                          />
                          <label className="custom-control-label" htmlFor="perm-home">
                            WEB/HOME
                          </label>
                        </div>
                        <div className="custom-control custom-checkbox">
                          <input
                            type="checkbox"
                            className="custom-control-input"
                            id="perm-users"
                            checked={!!formData.permissions.users}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                permissions: { ...formData.permissions, users: e.target.checked },
                              })
                            }
                          />
                          <label className="custom-control-label" htmlFor="perm-users">
                            Users
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer justify-content-between">
                  <button
                    type="button"
                    className="btn btn-default"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save
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
