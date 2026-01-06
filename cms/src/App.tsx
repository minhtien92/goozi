import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Topics from './pages/Topics';
import Vocabularies from './pages/Vocabularies';
import Languages from './pages/Languages';
import HomeSettings from './pages/HomeSettings';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const isAdmin = useAuthStore((state) => state.isAdmin());
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="topics" element={<Topics />} />
          <Route path="vocabularies" element={<Vocabularies />} />
          <Route path="languages" element={<Languages />} />
          <Route path="home-settings" element={<HomeSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

