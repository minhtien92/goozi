import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';
import logoSvg from '../assets/img/logo.svg';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isHomeMenuOpen, setIsHomeMenuOpen] = useState(false);
  const [isVocabularyMenuOpen, setIsVocabularyMenuOpen] = useState(false);

  useEffect(() => {
    // Auto-open menu if on home-settings or testimonials page
    setIsHomeMenuOpen(location.pathname.startsWith('/home-settings') || location.pathname.startsWith('/testimonials'));
    // Auto-open Vocabulary menu if on topics or vocabularies page
    setIsVocabularyMenuOpen(location.pathname.startsWith('/topics') || location.pathname.startsWith('/vocabularies'));
  }, [location.pathname]);

  useEffect(() => {
    // Initialize AdminLTE
    if (window.$) {
      window.$(document).ready(() => {
        // Enable sidebar push menu
        window.$('[data-widget="pushmenu"]').PushMenu('init');
        
        // Initialize treeview
        window.$('[data-widget="treeview"]').Treeview('init');
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
                <i className="fas fa-sign-out-alt mr-2"></i> Logout
              </a>
            </div>
          </li>
        </ul>
      </nav>

      {/* Main Sidebar Container */}
      <aside className="main-sidebar sidebar-dark-primary elevation-4">
        {/* Brand Logo */}
        <Link to="/" className="brand-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.8rem 0.5rem' }}>
          <img src={logoSvg} alt="Goozi Logo" style={{ maxWidth: '140px', height: 'auto' }} />
        </Link>

        {/* Sidebar */}
        <div className="sidebar d-flex flex-column" style={{ minHeight: '100%' }}>
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
                <Link to="/languages" className={`nav-link ${isActive('/languages') ? 'active' : ''}`}>
                  <i className="nav-icon fas fa-globe"></i>
                  <p>Language</p>
                </Link>
              </li>
              {user?.role === 'admin' && ((user.permissions?.topics ?? true) || (user.permissions?.vocabularies ?? true)) && (
                <li className={`nav-item has-treeview ${isVocabularyMenuOpen ? 'menu-open' : ''}`}>
                  <a 
                    href="#" 
                    className={`nav-link ${location.pathname.startsWith('/topics') || location.pathname.startsWith('/vocabularies') ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsVocabularyMenuOpen(!isVocabularyMenuOpen);
                    }}
                  >
                    <i className="nav-icon fas fa-book"></i>
                    <p>
                      Vocabulary
                      <i className={`right fas fa-angle-${isVocabularyMenuOpen ? 'down' : 'left'}`} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}></i>
                    </p>
                  </a>
                  <ul className="nav nav-treeview" style={{ display: isVocabularyMenuOpen ? 'block' : 'none' }}>
                    {user?.role === 'admin' && (user.permissions?.topics ?? true) && (
                      <li className="nav-item">
                        <Link
                          to="/topics"
                          className={`nav-link ${isActive('/topics') ? 'active' : ''}`}
                        >
                          <i className="far fa-circle nav-icon"></i>
                          <p>Topics</p>
                        </Link>
                      </li>
                    )}
                    {user?.role === 'admin' && (user.permissions?.vocabularies ?? true) && (
                      <li className="nav-item">
                        <Link
                          to="/vocabularies"
                          className={`nav-link ${isActive('/vocabularies') ? 'active' : ''}`}
                        >
                          <i className="far fa-circle nav-icon"></i>
                          <p>Word</p>
                        </Link>
                      </li>
                    )}
                  </ul>
                </li>
              )}
              <li className="nav-item">
                <a href="#" className="nav-link">
                  <i className="nav-icon fas fa-quote-left"></i>
                  <p>Phrase</p>
                </a>
              </li>
              <li className="nav-item">
                <a href="#" className="nav-link">
                  <i className="nav-icon fas fa-align-left"></i>
                  <p>Sentence</p>
                </a>
              </li>
              {user?.role === 'admin' && (user.permissions?.home ?? true) && (
              <li className={`nav-item has-treeview ${isHomeMenuOpen ? 'menu-open' : ''}`}>
                <a 
                  href="#" 
                  className={`nav-link ${location.pathname.startsWith('/home-settings') || location.pathname.startsWith('/testimonials') ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsHomeMenuOpen(!isHomeMenuOpen);
                  }}
                >
                  <i className="nav-icon fas fa-home"></i>
                  <p>
                    Web/Home
                    <i className={`right fas fa-angle-${isHomeMenuOpen ? 'down' : 'left'}`} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}></i>
                  </p>
                </a>
                <ul className="nav nav-treeview" style={{ display: isHomeMenuOpen ? 'block' : 'none' }}>
                  <li className="nav-item">
                    <Link
                      to="/home-settings/slogan"
                      className={`nav-link ${isActive('/home-settings/slogan') ? 'active' : ''}`}
                    >
                      <i className="far fa-circle nav-icon"></i>
                      <p>Slogan</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/home-settings/picture"
                      className={`nav-link ${isActive('/home-settings/picture') ? 'active' : ''}`}
                    >
                      <i className="far fa-circle nav-icon"></i>
                      <p>Picture</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/testimonials"
                      className={`nav-link ${isActive('/testimonials') ? 'active' : ''}`}
                    >
                      <i className="far fa-circle nav-icon"></i>
                      <p>Testimonial</p>
                    </Link>
                  </li>
                </ul>
              </li>
              )}
              <li className="nav-item">
                <Link to="/feedback" className={`nav-link ${isActive('/feedback') ? 'active' : ''}`}>
                  <i className="nav-icon fas fa-comments"></i>
                  <p>Feedback</p>
                </Link>
              </li>
              <li className="nav-header">SYSTEM</li>
              {user?.role === 'admin' && (user.permissions?.users ?? true) && (
                <li className="nav-item">
                  <Link to="/users" className={`nav-link ${isActive('/users') ? 'active' : ''}`}>
                    <i className="nav-icon fas fa-users"></i>
                    <p>Users</p>
                  </Link>
                </li>
              )}
              <li className="nav-item">
                <a href="#" className="nav-link" onClick={handleLogout}>
                  <i className="nav-icon fas fa-sign-out-alt"></i>
                  <p>Logout</p>
                </a>
              </li>
            </ul>
          </nav>

          {/* Sidebar user panel ở đáy */}
          <div className="mt-auto border-top">
            <div className="user-panel py-3 px-3 d-flex align-items-center">
              <div className="image">
                <div
                  className="img-circle elevation-2 bg-primary d-flex align-items-center justify-content-center"
                  style={{ width: '36px', height: '36px' }}
                >
                  <i className="fas fa-user text-white"></i>
                </div>
              </div>
              <div className="info ml-2">
                <span className="d-block text-sm text-light">{user?.name}</span>
                <span className="d-block text-xs text-muted">{user?.email}</span>
              </div>
            </div>
          </div>
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
                  {location.pathname === '/users' && 'User Management'}
                  {location.pathname === '/topics' && 'Topic Management'}
                  {location.pathname === '/vocabularies' && 'Vocabulary Management'}
                  {location.pathname === '/languages' && 'Language Management'}
                  {location.pathname === '/home-settings/slogan' && 'Slogan Management'}
                  {location.pathname === '/home-settings/picture' && 'Picture Management'}
                  {location.pathname === '/testimonials' && 'Testimonial Management'}
                  {location.pathname === '/feedback' && 'Feedback Management'}
                </h1>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item">
                    <Link to="/">Home</Link>
                  </li>
                  <li className="breadcrumb-item active">
                    {location.pathname === '/' && 'Dashboard'}
                    {location.pathname === '/users' && 'Users'}
                    {location.pathname === '/topics' && 'Topics'}
                    {location.pathname === '/vocabularies' && 'Vocabularies'}
                    {location.pathname === '/languages' && 'Languages'}
                    {location.pathname === '/home-settings/slogan' && 'Slogan'}
                    {location.pathname === '/home-settings/picture' && 'Picture'}
                    {location.pathname === '/testimonials' && 'Testimonial'}
                    {location.pathname === '/feedback' && 'Feedback'}
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
