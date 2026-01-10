import { useEffect, useState } from 'react';
import api from '../config/api';

interface Feedback {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  message: string;
  rating?: number;
  createdAt: string;
}

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      // TODO: Thay đổi endpoint này khi backend có API feedback
      // const response = await api.get('/feedbacks');
      // setFeedbacks(response.data.feedbacks);
      
      // Tạm thời để trống cho đến khi có API
      setFeedbacks([]);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
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
      <div className="card">
        <div className="card-header">
          <h3 className="card-title mb-0">Feedback List</h3>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>No</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Content</th>
                  <th style={{ width: '100px' }}>Rating</th>
                  <th style={{ width: '150px' }}>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No feedback yet
                    </td>
                  </tr>
                ) : (
                  feedbacks.map((feedback, index) => (
                    <tr key={feedback.id}>
                      <td>{index + 1}</td>
                      <td>{feedback.userName || 'N/A'}</td>
                      <td>{feedback.userEmail || 'N/A'}</td>
                      <td>
                        <div
                          className="text-truncate"
                          style={{ maxWidth: '400px' }}
                          title={feedback.message}
                        >
                          {feedback.message}
                        </div>
                      </td>
                      <td>
                        {feedback.rating ? (
                          <div>
                            {[...Array(5)].map((_, i) => (
                              <i
                                key={i}
                                className={`fas fa-star ${i < feedback.rating! ? 'text-warning' : 'text-muted'}`}
                              ></i>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {new Date(feedback.createdAt).toLocaleDateString('vi-VN')}
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
  );
}

