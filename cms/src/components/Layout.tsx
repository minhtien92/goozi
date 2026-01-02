import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Initialize AdminLTE
    if (window.$) {
      window.$(document).ready(() => {
        // Enable sidebar push menu
        window.$('[data-widget="pushmenu"]').PushMenu('init');
      });
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="wrapper">
      {/* Navbar */}
      <nav className="main-header navbar navbar-expand navbar-white navbar-light">
        {/* Left navbar links */}
        <ul className="navbar-nav">
          <li className="nav-item">
            <a className="nav-link" data-widget="pushmenu" href="#" role="button">
              <i className="fas fa-bars"></i>
            </a>
          </li>
          <li className="nav-item d-none d-sm-inline-block">
            <Link to="/" className="nav-link">
              Dashboard
            </Link>
          </li>
        </ul>

        {/* Right navbar links */}
        <ul className="navbar-nav ml-auto">
          <li className="nav-item dropdown">
            <a className="nav-link" data-toggle="dropdown" href="#">
              <i className="far fa-user"></i>
              <span className="ml-2">{user?.name}</span>
            </a>
            <div className="dropdown-menu dropdown-menu-lg dropdown-menu-right">
              <span className="dropdown-item dropdown-header">
                {user?.email}
              </span>
              <div className="dropdown-divider"></div>
              <a href="#" className="dropdown-item" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt mr-2"></i> Đăng xuất
              </a>
            </div>
          </li>
        </ul>
      </nav>

      {/* Main Sidebar Container */}
      <aside className="main-sidebar sidebar-dark-primary elevation-4">
        {/* Brand Logo */}
        <Link to="/" className="brand-link">
          <span className="brand-text font-weight-light">Goozi CMS</span>
        </Link>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Sidebar user panel */}
          <div className="user-panel mt-3 pb-3 mb-3 d-flex">
            <div className="image">
              <div className="img-circle elevation-2 bg-primary d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="fas fa-user text-white"></i>
              </div>
            </div>
            <div className="info">
              <a href="#" className="d-block">{user?.name}</a>
            </div>
          </div>

          {/* Sidebar Menu */}
          <nav className="mt-2">
            <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
              <li className="nav-item">
                <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                  <i className="nav-icon fas fa-tachometer-alt"></i>
                  <p>Dashboard</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/users" className={`nav-link ${isActive('/users') ? 'active' : ''}`}>
                  <i className="nav-icon fas fa-users"></i>
                  <p>Người dùng</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/topics" className={`nav-link ${isActive('/topics') ? 'active' : ''}`}>
                  <i className="nav-icon fas fa-folder"></i>
                  <p>Chủ đề</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/vocabularies" className={`nav-link ${isActive('/vocabularies') ? 'active' : ''}`}>
                  <i className="nav-icon fas fa-book"></i>
                  <p>Từ vựng</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/languages" className={`nav-link ${isActive('/languages') ? 'active' : ''}`}>
                  <i className="nav-icon fas fa-globe"></i>
                  <p>Ngôn ngữ</p>
                </Link>
              </li>
              <li className="nav-header">HỆ THỐNG</li>
              <li className="nav-item">
                <a href="#" className="nav-link" onClick={handleLogout}>
                  <i className="nav-icon fas fa-sign-out-alt"></i>
                  <p>Đăng xuất</p>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Content Wrapper */}
      <div className="content-wrapper">
        {/* Content Header */}
        <div className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="m-0">
                  {location.pathname === '/' && 'Dashboard'}
                  {location.pathname === '/users' && 'Quản lý người dùng'}
                  {location.pathname === '/topics' && 'Quản lý chủ đề'}
                  {location.pathname === '/vocabularies' && 'Quản lý từ vựng'}
                  {location.pathname === '/languages' && 'Quản lý ngôn ngữ'}
                </h1>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item">
                    <Link to="/">Home</Link>
                  </li>
                  <li className="breadcrumb-item active">
                    {location.pathname === '/' && 'Dashboard'}
                    {location.pathname === '/users' && 'Người dùng'}
                    {location.pathname === '/topics' && 'Chủ đề'}
                    {location.pathname === '/vocabularies' && 'Từ vựng'}
                    {location.pathname === '/languages' && 'Ngôn ngữ'}
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <section className="content">
          <div className="container-fluid">
            <Outlet />
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="main-footer">
        <strong>Copyright &copy; 2024 <a href="#">Goozi</a>.</strong>
        All rights reserved.
        <div className="float-right d-none d-sm-inline-block">
          <b>Version</b> 1.0.0
        </div>
      </footer>
    </div>
  );
}

// Extend Window interface for jQuery
declare global {
  interface Window {
    $: any;
  }
}
