import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    topics: 0,
    vocabularies: 0,
    languages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, topicsRes, vocabRes, langRes] = await Promise.all([
        api.get('/users'),
        api.get('/topics'),
        api.get('/vocabularies'),
        api.get('/languages'),
      ]);

      setStats({
        users: usersRes.data.users?.length || 0,
        topics: topicsRes.data.topics?.length || 0,
        vocabularies: vocabRes.data.vocabularies?.length || 0,
        languages: langRes.data.languages?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
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
      {/* Info boxes */}
      <div className="row">
        <div className="col-lg-3 col-6">
          <div className="small-box bg-info">
            <div className="inner">
              <h3>{stats.users}</h3>
              <p>Users</p>
            </div>
            <div className="icon">
              <i className="fas fa-users"></i>
            </div>
              <Link to="/users" className="small-box-footer">
              More info <i className="fas fa-arrow-circle-right"></i>
            </Link>
          </div>
        </div>

        <div className="col-lg-3 col-6">
          <div className="small-box bg-success">
            <div className="inner">
              <h3>{stats.topics}</h3>
              <p>Topics</p>
            </div>
            <div className="icon">
              <i className="fas fa-folder"></i>
            </div>
            <Link to="/topics" className="small-box-footer">
              More info <i className="fas fa-arrow-circle-right"></i>
            </Link>
          </div>
        </div>

        <div className="col-lg-3 col-6">
          <div className="small-box bg-warning">
            <div className="inner">
              <h3>{stats.vocabularies}</h3>
              <p>Vocabularies</p>
            </div>
            <div className="icon">
              <i className="fas fa-book"></i>
            </div>
            <Link to="/vocabularies" className="small-box-footer">
              More info <i className="fas fa-arrow-circle-right"></i>
            </Link>
          </div>
        </div>

        <div className="col-lg-3 col-6">
          <div className="small-box bg-danger">
            <div className="inner">
              <h3>{stats.languages}</h3>
              <p>Languages</p>
            </div>
            <div className="icon">
              <i className="fas fa-globe"></i>
            </div>
            <Link to="/languages" className="small-box-footer">
              More info <i className="fas fa-arrow-circle-right"></i>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="fas fa-bolt mr-1"></i>
                Quick Management
              </h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <Link to="/users" className="btn btn-primary btn-block mb-2">
                    <i className="fas fa-users mr-2"></i>
                    User Management
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/topics" className="btn btn-success btn-block mb-2">
                    <i className="fas fa-folder mr-2"></i>
                    Topic Management
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/vocabularies" className="btn btn-warning btn-block mb-2">
                    <i className="fas fa-book mr-2"></i>
                    Vocabulary Management
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/languages" className="btn btn-danger btn-block mb-2">
                    <i className="fas fa-globe mr-2"></i>
                    Language Management
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
