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

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
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
        topics: user.permissions?.topics ?? true,
        vocabularies: user.permissions?.vocabularies ?? true,
        home: user.permissions?.home ?? true,
        users: user.permissions?.users ?? true,
      },
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'admin',
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
          permissions: formData.permissions,
        };
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        // create new
        await api.post('/users', formData);
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

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title mb-0">User List</h3>
          <div className="card-tools">
            <button className="btn btn-primary btn-sm" onClick={handleCreate}>
              <i className="fas fa-plus mr-1"></i> Add User
            </button>
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
              {users.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-secondary'}`}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
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
            </tbody>
          </table>
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
