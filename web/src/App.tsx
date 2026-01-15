import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Register from './pages/Register';
import Home from './pages/Home';
import Topics from './pages/Topics';
import TopicDetail from './pages/TopicDetail';
import Flashcard from './pages/Flashcard';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Home />} />
        <Route path="/register" element={<Register />} />
        {/* Home page - accessible without login */}
        <Route path="/" element={<Home />} />
        {/* Protected routes - require login */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="topics" element={<Topics />} />
          <Route path="topics/:id" element={<TopicDetail />} />
          <Route path="topics/:id/flashcard" element={<Flashcard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

